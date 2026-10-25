import type Stripe from "stripe";
import { jsonError } from "@/lib/api";
import { isActiveSubscription } from "@/lib/premium/features";
import {
    eventSubscriptionId,
    HANDLED_EVENTS,
    subscriptionRow,
} from "@/lib/premium/webhook";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/stripe — records subscription changes. Each event is
 * verified against STRIPE_WEBHOOK_SECRET, and the subscription is re-read
 * from Stripe rather than taken from the event, so late or repeated
 * deliveries can't overwrite newer state.
 */
export async function POST(request: Request) {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret)
        return jsonError("Webhooks aren't configured.", 503);

    const signature = request.headers.get("stripe-signature");
    if (!signature) return jsonError("Missing signature.", 400);
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            await request.text(),
            signature,
            secret,
        );
    } catch {
        return jsonError("Invalid signature.", 400);
    }
    if (!HANDLED_EVENTS.has(event.type))
        return Response.json({ received: true });

    const subscriptionId = eventSubscriptionId(event);
    if (!subscriptionId) return Response.json({ received: true });

    try {
        const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
        const row = subscriptionRow(subscription);
        const admin = createAdminClient();

        // The user is found only through the Stripe customer that checkout
        // created for them and saved first. Event fields such as
        // client_reference_id or metadata are not trusted: a payment link
        // can set them to anyone.
        const { data: current, error: findError } = await admin
            .from("subscriptions")
            .select(
                "user_id, stripe_subscription_id, status, current_period_end",
            )
            .eq("stripe_customer_id", row.stripe_customer_id)
            .maybeSingle();
        if (findError) throw findError;
        // Unknown customer (e.g. created outside this app): nothing to record.
        if (!current) return Response.json({ received: true });

        // A late event about an old subscription must not replace a
        // different subscription the user is still paying for.
        const replacesOther =
            current.stripe_subscription_id !== null &&
            current.stripe_subscription_id !== row.stripe_subscription_id;
        if (
            replacesOther &&
            isActiveSubscription(current.status, current.current_period_end) &&
            !isActiveSubscription(row.status, row.current_period_end)
        ) {
            return Response.json({ received: true });
        }

        const { error } = await admin
            .from("subscriptions")
            .update(row)
            .eq("user_id", current.user_id);
        if (error) throw error;
        return Response.json({ received: true });
    } catch {
        // A 5xx makes Stripe retry the delivery.
        return jsonError("Couldn't record the subscription.", 500);
    }
}
