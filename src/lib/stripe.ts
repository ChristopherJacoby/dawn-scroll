import "server-only";
import Stripe from "stripe";
import { PRICE_LOOKUP_KEYS } from "@/lib/premium/plan-lookup";
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
