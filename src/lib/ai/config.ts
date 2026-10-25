/**
 * AI settings, all from the environment so cost controls can change
 * without a deploy. The API key is read only by the server-side provider
 * and never reaches a client bundle.
 */

export type AiMode = "scholar" | "apostle";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type AiEffort = (typeof EFFORTS)[number];

function positiveInt(value: string | undefined, fallback: number): number {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function aiConfig() {
    const effort = process.env.AI_EFFORT as AiEffort | undefined;
    return {
        /** "anthropic" (needs ANTHROPIC_API_KEY) or "mock" (canned replies, for development). */
        provider: process.env.AI_PROVIDER === "mock" ? "mock" : "anthropic",
        model: process.env.AI_MODEL || "claude-opus-5-5",
        effort: effort && EFFORTS.includes(effort) ? effort : "medium",
        /** Covers thinking and the answer; a hard ceiling on cost per reply. */
        maxTokens: positiveInt(process.env.AI_MAX_TOKENS, 8000),
        /** Prior turns sent with each request. */
        maxHistoryTurns: positiveInt(process.env.AI_MAX_HISTORY_TURNS, 12),
        dailyLimit: {
            free: positiveInt(process.env.AI_DAILY_LIMIT_FREE, 10),
            premium: positiveInt(process.env.AI_DAILY_LIMIT_PREMIUM, 100),
            /** All users together, per mode: a ceiling on daily spend. */
            global: positiveInt(process.env.AI_DAILY_LIMIT_GLOBAL, 500),
        },
    } as const;
}

/** Whether chat can run at all: a key is set, or the mock provider is on. */
export function isAiConfigured(): boolean {
    const { provider } = aiConfig();
    return provider === "mock" || Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Models that accept the server-side refusal fallback (`fallbacks:
 * "default"`); other models are called without it.
 */
export const FALLBACK_MODELS = new Set([
    "claude-opus-5-5",
    "claude-opus-5",
    "claude-fable-5-1",
    "claude-sonnet-5-5",
]);
