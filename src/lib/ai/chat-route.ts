import "server-only";
import {
    jsonError,
    readJson,
    rejectUntrustedMutation,
    unauthorized,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
    type ChatStreamEvent,
    type ChatTurn,
    type PassageRef,
    parseChatBody,
} from "./chat";
import { AiError, streamChat } from "./client";
import { type AiMode, aiConfig, isAiConfigured } from "./config";
import { logAiError } from "./log";
import {
    type AiClaim,
    claimAiRequest,
    dailyLimit,
    releaseAiRequest,
} from "./usage";

export interface ChatSetup {
    /** Who answers, for messages: "The Scholar", "Peter". */
    speaker: string;
    system: string;
    /** Grounding for this question; runs after the request is claimed. */
    context?: (
        turns: ChatTurn[],
        passage: PassageRef | null,
    ) => Promise<string>;
}

/** Lines of JSON, one event each, written as the reply streams. */
function ndjson(events: AsyncIterable<ChatStreamEvent>): Response {
    const encoder = new TextEncoder();
    const iterator = events[Symbol.asyncIterator]();
    const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) controller.close();
            else
                controller.enqueue(
                    encoder.encode(`${JSON.stringify(value)}\n`),
                );
        },
        async cancel() {
            await iterator.return?.();
        },
    });
    return new Response(body, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}

/**
 * The shared chat endpoint: CSRF guard, a signed-in user with a confirmed
 * email, validation, the daily caps, then the streamed reply as NDJSON
 * (see ChatStreamEvent). `setup` validates the mode's own fields and
 * access before anything is claimed, returning a Response to refuse.
 */
export async function handleChatRequest(
    request: Request,
    mode: AiMode,
    setup: (body: unknown) => Promise<ChatSetup | Response>,
): Promise<Response> {
    const rejected = rejectUntrustedMutation(request, { hasBody: true });
    if (rejected) return rejected;
    const user = await getUser();
    if (!user) return unauthorized();
    if (!isAiConfigured()) {
        return jsonError("AI chat isn't available yet.", 503);
    }
    // Unconfirmed addresses could be throwaway accounts made to multiply
    // the daily limit.
    if (!user.email_confirmed_at) {
        return jsonError("Confirm your email address to use AI chat.", 403);
    }

    const body = await readJson(request);
    const parsed = parseChatBody(body, aiConfig().maxHistoryTurns);
    if (!parsed.ok) return jsonError(parsed.error, 400);
    const prepared = await setup(body);
    if (prepared instanceof Response) return prepared;
    const { speaker, system } = prepared;

    let limit: number;
    let claim: AiClaim;
    try {
        limit = await dailyLimit();
        claim = await claimAiRequest(user.id, mode, limit);
    } catch (error) {
        logAiError("Couldn't claim an AI request", error);
        return jsonError("AI chat isn't available right now.", 503);
    }
    if (!claim.ok) {
        return claim.reason === "user-limit"
            ? jsonError(
                  `You've asked ${limit} questions today, the daily limit. It resets at midnight UTC.`,
                  429,
              )
            : Response.json(
                  {
                      error: `${speaker} has answered all they can for today. Try again after midnight UTC.`,
                      // Asking again today won't help.
                      retryable: false,
                  },
                  { status: 503 },
              );
    }

    const { turns } = parsed;
    const userId = user.id;
    const remaining = limit - claim.used;
    const context = prepared.context
        ? await prepared.context(turns, parsed.passage)
        : "";

    async function* events(): AsyncGenerator<ChatStreamEvent> {
        yield { type: "meta", remaining, limit };
        let answered = false;
        try {
            for await (const event of streamChat(
                userId,
                mode,
                { system, turns, context },
                // Needed even though cancel() stops the stream: it aborts the
                // API call at once, rather than at the next streamed chunk.
                request.signal,
            )) {
                if (event.type === "text") {
                    answered = true;
                    yield { type: "text", text: event.text };
                } else if (event.stopReason === "refusal") {
                    yield {
                        type: "error",
                        message: `${speaker} couldn't answer that. Try asking another way.`,
                        retryable: false,
                    };
                } else {
                    yield {
                        type: "done",
                        truncated: event.stopReason === "max_tokens",
                    };
                }
            }
        } catch (error) {
            // Headers are already sent, so failures travel in the stream.
            if (error instanceof AiError && error.code !== "aborted") {
                // An outage shouldn't use up the reader's questions.
                if (
                    !answered &&
                    (error.code === "busy" || error.code === "unavailable")
                ) {
                    const released = await releaseAiRequest(userId, mode).then(
                        () => true,
                        (e) => {
                            logAiError("Couldn't release an AI request", e);
                            return false;
                        },
                    );
                    if (released) {
                        yield { type: "meta", remaining: remaining + 1, limit };
                    }
                }
                yield {
                    type: "error",
                    message: error.message,
                    retryable: true,
                };
            }
        }
    }
    return ndjson(events());
}
