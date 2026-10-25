import type Stripe from "stripe";
import { TRIAL_DAYS } from "./plans";

/**
 * Checkout Session parameters for a premium subscription. The trial is
 * offered only to people who have never subscribed before.
 */
export function checkoutSessionParams({
    customerId,
    priceId,
    userId,
    origin,
    offerTrial,
}: {
    customerId: string;
    priceId: string;
    userId: string;
    origin: string;
    offerTrial: boolean;
}): Stripe.Checkout.SessionCreateParams {
    return {
        mode: "subscription",
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
            metadata: { user_id: userId },
            ...(offerTrial && { trial_period_days: TRIAL_DAYS }),
        },
        success_url: `${origin}/account/subscription?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=canceled`,
    };
}
