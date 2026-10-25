import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn } from "./chat";
import { aiConfig, FALLBACK_MODELS } from "./config";

export interface ChatRequest {
    /** Stable instructions for the mode; cached across requests. */
    system: string;
    /** The conversation, ending with the user's new message. */
    turns: ChatTurn[];
    /** Per-request grounding (retrieved sources, the passage being read). */
    context?: string;
}

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
}

export type ChatEvent =
    | { type: "text"; text: string }
    | { type: "done"; usage: TokenUsage; stopReason: string | null };

export interface ChatProvider {
    stream(
        request: ChatRequest,
        signal?: AbortSignal,
    ): AsyncIterable<ChatEvent>;
}

let anthropic: Anthropic | null = null;

/** Claude via the Messages API, streamed. */
const anthropicProvider: ChatProvider = {
    async *stream({ system, turns, context }, signal) {
        // Reads ANTHROPIC_API_KEY. Retries connection errors, 429s and 5xxs
        // with backoff before the stream starts.
        anthropic ??= new Anthropic({ maxRetries: 3 });
        const config = aiConfig();
        const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({
            role: t.role,
            content: t.content,
        }));
        // Grounding goes in a system message after the user's turn: it
        // carries operator authority without disturbing the cached prefix.
        if (context) messages.push({ role: "system", content: context });
        const fallback = FALLBACK_MODELS.has(config.model);
        const stream = anthropic.beta.messages.stream(
            {
                model: config.model,
                max_tokens: config.maxTokens,
                output_config: { effort: config.effort },
                system: [
                    {
                        type: "text",
                        text: system,
                        cache_control: { type: "ephemeral" },
                    },
                ],
                messages,
                // On a safety-classifier refusal, the API retries on a
                // suitable model inside the same call.
                ...(fallback && {
                    betas: ["server-side-fallback-2026-07-01"],
                    fallbacks: "default" as const,
                }),
            },
            { signal },
        );
        for await (const event of stream) {
            if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
            ) {
                yield { type: "text", text: event.delta.text };
            }
        }
        const message = await stream.finalMessage();
        yield {
            type: "done",
            stopReason: message.stop_reason,
            usage: {
                inputTokens: message.usage.input_tokens,
                outputTokens: message.usage.output_tokens,
                cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
            },
        };
    },
};

/**
 * Canned, streamed replies for development and tests: no key, no cost.
 * Echoes what the request carried so the plumbing can be checked.
 */
export const mockProvider: ChatProvider = {
    async *stream({ turns, context }, signal) {
        const question = turns.at(-1)?.content ?? "";
        const passage = context?.match(/<passage reference="([^"]+)">/)?.[1];
        const sources = [...(context?.matchAll(/^\[([^\]]+)\]/gm) ?? [])]
            .map((m) => m[1])
            .slice(0, 3);
        const reply = [
            `**Mock reply.** You asked: "${question.slice(0, 80)}"`,
            passage ? `You're reading ${passage}.` : "No passage was attached.",
            sources.length
                ? `Retrieved sources:\n${sources.map((s) => `- ${s}`).join("\n")}`
                : "No sources were retrieved.",
            "Example citations: John 3:16 and Leviticus 23:34-36. Example link: [the Pilate Stone](/archaeology/pilate-stone).",
        ].join("\n\n");
        for (const word of reply.split(/(?<= )/)) {
            if (signal?.aborted) throw new Anthropic.APIUserAbortError();
            await new Promise((resolve) => setTimeout(resolve, 15));
            yield { type: "text", text: word };
        }
        yield {
            type: "done",
            stopReason: "end_turn",
            usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 },
        };
    },
};

export function getChatProvider(): ChatProvider {
    return aiConfig().provider === "mock" ? mockProvider : anthropicProvider;
}
