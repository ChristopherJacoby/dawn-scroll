import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AiMode } from "./config";
import {
    getChatProvider,
    type ChatEvent,
    type ChatRequest,
    type TokenUsage,
} from "./provider";
import { logAiError } from "./log";
import { recordAiTokens } from "./usage";

export type AiErrorCode = "unavailable" | "busy" | "aborted" | "failed";

/** A failure safe to show users; the cause is logged, never returned. */
export class AiError extends Error {
    constructor(
        readonly code: AiErrorCode,
        message: string,
    ) {
        super(message);
        this.name = "AiError";
    }
}

/** Maps SDK failures (after its own retries) to a user-facing error. */
export function toAiError(error: unknown): AiError {
    if (error instanceof AiError) return error;
    if (error instanceof Anthropic.APIUserAbortError) {
        return new AiError("aborted", "The request was canceled.");
    }
    if (error instanceof Anthropic.APIConnectionError) {
        return new AiError(
            "unavailable",
            "The assistant is unavailable right now.",
        );
    }
    if (error instanceof Anthropic.APIError) {
        // Errors sent mid-stream have no status, only the body's type.
        const type =
            error.type ??
            (error.error as { error?: { type?: string } } | undefined)?.error
                ?.type;
        const status = error.status ?? 0;
        if (
            status === 429 ||
            status >= 500 ||
            type === "overloaded_error" ||
            type === "rate_limit_error" ||
            type === "api_error" ||
            type === "timeout_error"
        ) {
            return new AiError(
                "busy",
                "The assistant is busy right now. Try again in a minute.",
            );
        }
        if (
            status === 401 ||
            status === 402 ||
            status === 403 ||
            type === "billing_error" ||
            type === "authentication_error" ||
            type === "permission_error"
        ) {
            return new AiError(
                "unavailable",
                "The assistant is unavailable right now.",
            );
        }
    }
    return new AiError("failed", "Something went wrong. Try again.");
}

/**
 * Streams one reply, then records its token usage against the user in
 * ai_usage, including a reply cut short by an error or the reader leaving
 * (the API bills those too). Errors arrive as AiError; a failure to record
 * is logged only, so a bookkeeping hiccup never costs the user an answer.
 */
export async function* streamChat(
    userId: string,
    mode: AiMode,
    request: ChatRequest,
    signal?: AbortSignal,
): AsyncGenerator<Exclude<ChatEvent, { type: "usage" }>> {
    let usage: TokenUsage | null = null;
    try {
        for await (const event of getChatProvider().stream(request, signal)) {
            if (event.type === "usage") {
                usage = event.usage;
                continue;
            }
            if (event.type === "done") usage = event.usage;
            yield event;
        }
    } catch (error) {
        const aiError = toAiError(error);
        if (aiError.code !== "aborted") logAiError("AI request failed", error);
        throw aiError;
    } finally {
        if (usage) {
            await recordAiTokens(userId, mode, usage).catch((error) =>
                logAiError("Failed to record AI usage", error),
            );
        }
    }
}
