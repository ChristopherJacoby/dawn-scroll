import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionStatus } from "@/lib/premium/subscription";
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

/**
 * The signed-in user's daily question limit. The premium limit needs an
 * active subscription with Premium switched on; while it's off (isPremium
 * is always false) everyone gets the free limit, so enabling AI before
 * Stripe can't hand out premium-sized usage.
 */
export async function dailyLimit(): Promise<number> {
    const { isPremium } = await getSubscriptionStatus();
    const { dailyLimit } = aiConfig();
    return isPremium ? dailyLimit.premium : dailyLimit.free;
}

/** Questions the user has left today in a mode, for display. */
export async function remainingToday(
    userId: string,
    mode: AiMode,
): Promise<{ remaining: number; limit: number }> {
    const limit = await dailyLimit();
    const { data, error } = await createAdminClient()
        .from("ai_usage")
        .select("requests")
        .eq("user_id", userId)
        .eq("mode", mode)
        // ai_usage days are the database's current_date, which is UTC.
        .eq("day", new Date().toISOString().slice(0, 10))
        .maybeSingle();
    if (error) throw error;
    return { remaining: Math.max(0, limit - (data?.requests ?? 0)), limit };
}
