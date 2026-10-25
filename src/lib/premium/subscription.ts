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

/** The signed-in user's subscription (or none). Memoized per render. */
export const getSubscriptionStatus = cache(
    async (): Promise<SubscriptionStatus> => {
        const premiumEnabled = isPremiumEnabled();
        // With Premium off nothing depends on the answer, so do no I/O: an
        // auth or database outage can never trip a gate.
        if (!premiumEnabled) return { premiumEnabled, ...NONE };
        const user = await getUser();
        if (!user) return { premiumEnabled, ...NONE };
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("subscriptions")
            .select("status, plan, current_period_end, cancel_at_period_end")
            .eq("user_id", user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data) return { premiumEnabled, ...NONE };
        return {
            premiumEnabled,
            isPremium: isActiveSubscription(
                data.status,
                data.current_period_end,
            ),
            status: data.status,
            plan: data.plan as PlanKey | null,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
        };
    },
);

/** Whether the current visitor may use a feature right now. */
export async function canUse(feature: FeatureKey): Promise<boolean> {
    // Skip the lookup when the answer doesn't depend on it.
    if (!isPremiumFeature(feature) || !isPremiumEnabled()) return true;
    return allows(feature, await getSubscriptionStatus());
}
