import "server-only";
import Stripe from "stripe";
import type { PlanKey } from "@/lib/premium/plans";

let stripe: Stripe | null = null;

/**
 * The Stripe client, or null until STRIPE_SECRET_KEY is set. Created
 * lazily so builds without the key still work.
 */
export function getStripe(): Stripe | null {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripe ??= new Stripe(key);
    return stripe;
}

/**
 * Prices are found by lookup key rather than configured by ID, so the
 * same code works in test and live mode once
 * scripts/create-stripe-products.mjs has created them.
 */
export const PRICE_LOOKUP_KEYS: Record<PlanKey, string> = {
    monthly: "dawnscroll_premium_monthly",
    annual: "dawnscroll_premium_annual",
};

/** The active price for a plan, or null if it hasn't been created. */
export async function getPriceId(
    client: Stripe,
    plan: PlanKey,
): Promise<string | null> {
    const prices = await client.prices.list({
        lookup_keys: [PRICE_LOOKUP_KEYS[plan]],
        active: true,
        limit: 1,
    });
    return prices.data[0]?.id ?? null;
}

/** Which plan a price belongs to, from its lookup key. */
export function planForLookupKey(lookupKey: string | null): PlanKey | null {
    const entry = Object.entries(PRICE_LOOKUP_KEYS).find(
        ([, key]) => key === lookupKey,
    );
    return entry ? (entry[0] as PlanKey) : null;
}
