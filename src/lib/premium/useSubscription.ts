"use client";

import { useEffect, useState } from "react";
import { allows, type FeatureKey, isPremiumFeature } from "./features";
import type { PlanKey } from "./plans";

interface ClientStatus {
    premiumEnabled: boolean;
    isPremium: boolean;
    plan: PlanKey | null;
}

/**
 * The visitor's premium access, for client components. Check `isLoading`
 * before acting on `canUse`: until the status arrives (or if it can't be
 * fetched) premium features count as unavailable, failing closed.
 */
export function useSubscription() {
    const [status, setStatus] = useState<ClientStatus | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/subscriptions/status", { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(String(response.status));
                return response.json() as Promise<ClientStatus>;
            })
            .then(setStatus)
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true);
            });
        return () => controller.abort();
    }, []);

    const isLoading = status === null && !failed;
    return {
        isPremium: status?.isPremium ?? false,
        isLoading,
        plan: status?.plan ?? null,
        canUse(feature: FeatureKey): boolean {
            if (!isPremiumFeature(feature)) return true;
            return status ? allows(feature, status) : false;
        },
    };
}
