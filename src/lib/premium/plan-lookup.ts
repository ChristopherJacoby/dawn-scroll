import type { PlanKey } from "./plans";

/**
 * Prices are found by lookup key rather than configured by ID, so the
 * same code works in test and live mode once
 * scripts/create-stripe-products.mjs has created them.
 */
export const PRICE_LOOKUP_KEYS: Record<PlanKey, string> = {
    monthly: "dawnscroll_premium_monthly",
    annual: "dawnscroll_premium_annual",
};

/** Which plan a price belongs to, from its lookup key. */
export function planForLookupKey(lookupKey: string | null): PlanKey | null {
    const entry = Object.entries(PRICE_LOOKUP_KEYS).find(
        ([, key]) => key === lookupKey,
    );
    return entry ? (entry[0] as PlanKey) : null;
}
