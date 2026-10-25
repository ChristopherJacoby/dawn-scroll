import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiMode } from "./config";
import type { TokenUsage } from "./provider";

/**
 * Claims one request against today's cap. Returns the count so far, or
 * null when the cap is reached. Atomic, so parallel requests can't exceed it.
 */
export async function claimAiRequest(
    userId: string,
    mode: AiMode,
    limit: number,
): Promise<number | null> {
    const { data, error } = await createAdminClient().rpc("claim_ai_request", {
        p_user: userId,
        p_mode: mode,
        p_limit: limit,
    });
    if (error) throw error;
    return (data as number | null) ?? null;
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
