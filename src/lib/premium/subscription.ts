import "server-only";
import { cache } from "react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
    allows,
    type FeatureKey,
    isActiveSubscription,
    isPremiumEnabled,
    isPremiumFeature,
} from "./features";
import type { PlanKey } from "./plans";

export interface SubscriptionStatus {
    /** Whether premium features are gated at all (see isPremiumEnabled). */
    premiumEnabled: boolean;
    isPremium: boolean;
    status: string;
    plan: PlanKey | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
}

const NONE: Omit<SubscriptionStatus, "premiumEnabled"> = {
    isPremium: false,
    status: "none",
    plan: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
};

/**
 * The signed-in user's subscription record, whether or not Premium is
 * switched on: for showing plan details and preventing double purchases.
 * Memoized per render.
 */
export const getSubscriptionRecord = cache(
    async (): Promise<Omit<SubscriptionStatus, "premiumEnabled">> => {
        const user = await getUser();
        if (!user) return NONE;
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("subscriptions")
            .select("status, plan, current_period_end, cancel_at_period_end")
            .eq("user_id", user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data) return NONE;
        return {
            // A subscription to a price that isn't one of our plans grants
            // nothing.
            isPremium:
                data.plan !== null &&
                isActiveSubscription(data.status, data.current_period_end),
            status: data.status,
            plan: data.plan as PlanKey | null,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
        };
    },
);

/**
 * The visitor's premium access, for gating. With Premium off nothing
 * depends on the answer, so it does no I/O: an auth or database outage can
 * never trip a gate. Memoized per render.
 */
export const getSubscriptionStatus = cache(
    async (): Promise<SubscriptionStatus> => {
        const premiumEnabled = isPremiumEnabled();
        if (!premiumEnabled) return { premiumEnabled, ...NONE };
        return { premiumEnabled, ...(await getSubscriptionRecord()) };
    },
);

/** Whether the current visitor may use a feature right now. */
export async function canUse(feature: FeatureKey): Promise<boolean> {
    // Skip the lookup when the answer doesn't depend on it.
    if (!isPremiumFeature(feature) || !isPremiumEnabled()) return true;
    return allows(feature, await getSubscriptionStatus());
}
