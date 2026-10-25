import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AiMode } from "./config";
import { getChatProvider, type ChatEvent, type ChatRequest } from "./provider";
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
        const type = (error.error as { error?: { type?: string } } | undefined)
            ?.error?.type;
        const status = error.status ?? 0;
        if (
            status === 429 ||
            status >= 500 ||
            type === "overloaded_error" ||
            type === "rate_limit_error"
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
            type === "billing_error"
        ) {
            return new AiError(
                "unavailable",
                "The assistant is unavailable right now.",
            );
        }
    }
    return new AiError("failed", "Something went wrong. Try again.");
}

/** Server log (Vercel function logs) for failures users only see generically. */
function logError(message: string, error: unknown) {
    // eslint-disable-next-line no-console -- server-side diagnostics
    console.error(message, error);
}

/**
 * Streams one reply, then records its token usage against the user in
 * ai_usage. Errors arrive as AiError; a failure to record is logged only,
 * so a bookkeeping hiccup never costs the user a finished answer.
 */
export async function* streamChat(
    userId: string,
    mode: AiMode,
    request: ChatRequest,
    signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
    try {
        for await (const event of getChatProvider().stream(request, signal)) {
            if (event.type === "done") {
                await recordAiTokens(userId, mode, event.usage).catch((error) =>
                    logError("Failed to record AI usage", error),
                );
            }
            yield event;
        }
    } catch (error) {
        const aiError = toAiError(error);
        if (aiError.code !== "aborted") logError("AI request failed", error);
        throw aiError;
    }
}
