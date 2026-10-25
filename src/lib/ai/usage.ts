import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiConfig, type AiMode } from "./config";
import type { TokenUsage } from "./provider";

export type AiClaim =
    | { ok: true; used: number }
    | { ok: false; reason: "user-limit" | "global-limit" };

/**
 * Claims one request against today's caps: the user's, then everyone's.
 * Atomic, so parallel requests can't exceed either.
 */
export async function claimAiRequest(
    userId: string,
    mode: AiMode,
    limit: number,
): Promise<AiClaim> {
    const { data, error } = await createAdminClient().rpc("claim_ai_request", {
        p_user: userId,
        p_mode: mode,
        p_limit: limit,
        p_global_limit: aiConfig().dailyLimit.global,
    });
    if (error) throw error;
    const used = data as number | null;
    if (used === null) return { ok: false, reason: "user-limit" };
    if (used === 0) return { ok: false, reason: "global-limit" };
    return { ok: true, used };
}

/** Gives back a claimed request, when the AI service failed before answering. */
export async function releaseAiRequest(
    userId: string,
    mode: AiMode,
): Promise<void> {
    const { error } = await createAdminClient().rpc("release_ai_request", {
        p_user: userId,
        p_mode: mode,
    });
    if (error) throw error;
}

/** Adds a reply's token usage to today's totals, for watching spend. */
export async function recordAiTokens(
    userId: string,
    mode: AiMode,
    usage: TokenUsage,
): Promise<void> {
    const { error } = await createAdminClient().rpc("record_ai_tokens", {
        p_user: userId,
        p_mode: mode,
        p_input: usage.inputTokens,
        p_output: usage.outputTokens,
        p_cache_read: usage.cacheReadTokens,
    });
    if (error) throw error;
}
