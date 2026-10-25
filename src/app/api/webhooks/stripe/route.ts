import type Stripe from "stripe";
import { jsonError } from "@/lib/api";
import {
    eventTarget,
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

    const { subscriptionId, userId: eventUserId } = eventTarget(event);
    if (!subscriptionId) return Response.json({ received: true });

    try {
        const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
        const row = subscriptionRow(subscription);
        const admin = createAdminClient();

        // Find the user: from the event, else by the customer saved at checkout.
        let userId = eventUserId;
        if (!userId) {
            const { data, error } = await admin
                .from("subscriptions")
                .select("user_id")
                .eq("stripe_customer_id", row.stripe_customer_id)
                .maybeSingle();
            if (error) throw error;
            userId = data?.user_id ?? null;
        }
        // Unknown customer (e.g. created outside this app): nothing to record.
        if (!userId) return Response.json({ received: true });

        const { error } = await admin
            .from("subscriptions")
            .upsert({ user_id: userId, ...row }, { onConflict: "user_id" });
        if (error) throw error;
        return Response.json({ received: true });
    } catch {
        // A 5xx makes Stripe retry the delivery.
        return jsonError("Couldn't record the subscription.", 500);
    }
}
