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
import { claimAiRequest } from "@/lib/ai/usage";
import { getSubscriptionStatus } from "@/lib/premium/subscription";

// Long answers can take a while to stream.
export const maxDuration = 60;

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
    if (!isAiConfigured())
        return jsonError("Scholar chat isn't available yet.", 503);

    const config = aiConfig();
    const parsed = parseChatBody(
        await readJson(request),
        config.maxHistoryTurns,
    );
    if (!parsed.ok) return jsonError(parsed.error, 400);

    // The premium limit needs an active subscription with Premium switched
    // on; while it's off (isPremium is always false) everyone gets the
    // free limit.
    const { isPremium } = await getSubscriptionStatus();
    const limit = isPremium
        ? config.dailyLimit.premium
        : config.dailyLimit.free;
    const used = await claimAiRequest(user.id, "scholar", limit);
    if (used === null) {
        return jsonError(
            `You've asked ${limit} questions today, the daily limit. Come back tomorrow.`,
            429,
        );
    }

    const { turns } = parsed;
    const userId = user.id;
    const remaining = limit - used;
    const [passage, sources] = await Promise.all([
        parsed.passage
            ? passageContext(parsed.passage).catch(() => null)
            : null,
        // Answers can do without sources, so a search failure isn't fatal.
        retrieveContext(turns.at(-1)!.content).catch(() => ""),
    ]);
    const context = [passage, sources].filter(Boolean).join("\n\n");

    async function* events(): AsyncGenerator<ChatStreamEvent> {
        yield { type: "meta", remaining, limit };
        try {
            for await (const event of streamChat(
                userId,
                "scholar",
                { system: SCHOLAR_SYSTEM_PROMPT, turns, context },
                request.signal,
            )) {
                if (event.type === "text") {
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
                yield { type: "error", message: error.message };
            }
        }
    }
    return ndjson(events());
}
