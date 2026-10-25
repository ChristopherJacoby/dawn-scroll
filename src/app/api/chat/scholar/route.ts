import {
    jsonError,
    readJson,
    rejectUntrustedMutation,
    unauthorized,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import { type ChatStreamEvent, parseChatBody } from "@/lib/ai/chat";
import { AiError, streamChat } from "@/lib/ai/client";
import { aiConfig, isAiConfigured } from "@/lib/ai/config";
import { passageContext } from "@/lib/ai/passage";
import { SCHOLAR_SYSTEM_PROMPT } from "@/lib/ai/prompts/scholar";
import { retrieveContext } from "@/lib/ai/retrieval";
import { logAiError } from "@/lib/ai/log";
import {
    type AiClaim,
    claimAiRequest,
    dailyLimit,
    releaseAiRequest,
} from "@/lib/ai/usage";

// A long, high-effort answer can stream for minutes; cut off early, the
// reply would just stop mid-sentence.
export const maxDuration = 300;

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
 * POST /api/chat/scholar — `{ messages, passage? }`. Streams the Scholar's
 * reply as NDJSON (see ChatStreamEvent). Signed-in users only, with a
 * daily question limit.
 */
export async function POST(request: Request) {
    const rejected = rejectUntrustedMutation(request, { hasBody: true });
    if (rejected) return rejected;
    const user = await getUser();
    if (!user) return unauthorized();
    // Unconfirmed addresses could be throwaway accounts made to multiply
    // the daily limit.
    if (!user.email_confirmed_at) {
        return jsonError("Confirm your email address to ask the Scholar.", 403);
    }
    if (!isAiConfigured())
        return jsonError("Scholar chat isn't available yet.", 503);

    const config = aiConfig();
    const parsed = parseChatBody(
        await readJson(request),
        config.maxHistoryTurns,
    );
    if (!parsed.ok) return jsonError(parsed.error, 400);

    let limit: number;
    let claim: AiClaim;
    try {
        limit = await dailyLimit();
        claim = await claimAiRequest(user.id, "scholar", limit);
    } catch (error) {
        logAiError("Couldn't claim an AI request", error);
        return jsonError("Scholar chat isn't available right now.", 503);
    }
    if (!claim.ok) {
        return claim.reason === "user-limit"
            ? jsonError(
                  `You've asked ${limit} questions today, the daily limit. It resets at midnight UTC.`,
                  429,
              )
            : jsonError(
                  "The Scholar has answered all it can for today. Try again after midnight UTC.",
                  503,
              );
    }

    const { turns } = parsed;
    const userId = user.id;
    const remaining = limit - claim.used;
    const [passage, sources] = await Promise.all([
        // Answers can do without the passage or sources, so a lookup
        // failure isn't fatal.
        parsed.passage
            ? passageContext(parsed.passage).catch((error) => {
                  logAiError("Couldn't load the passage", error);
                  return null;
              })
            : null,
        retrieveContext(turns.at(-1)!.content).catch((error) => {
            logAiError("Couldn't retrieve sources", error);
            return "";
        }),
    ]);
    const context = [passage, sources].filter(Boolean).join("\n\n");

    async function* events(): AsyncGenerator<ChatStreamEvent> {
        yield { type: "meta", remaining, limit };
        let answered = false;
        try {
            for await (const event of streamChat(
                userId,
                "scholar",
                { system: SCHOLAR_SYSTEM_PROMPT, turns, context },
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
                        message:
                            "The Scholar couldn't answer that. Try asking another way.",
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
                    await releaseAiRequest(userId, "scholar").catch((e) =>
                        logAiError("Couldn't release an AI request", e),
                    );
                }
                yield { type: "error", message: error.message };
            }
        }
    }
    return ndjson(events());
}
