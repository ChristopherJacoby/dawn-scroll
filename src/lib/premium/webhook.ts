import type Stripe from "stripe";
import { planForLookupKey } from "./plan-lookup";

/** Statuses the subscriptions table accepts (see its check constraint). */
const KNOWN_STATUSES = new Set([
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
]);

export interface SubscriptionRow {
    stripe_customer_id: string;
    stripe_subscription_id: string;
    status: string;
    plan: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

/**
 * A Stripe subscription as a subscriptions-table row. The billing period
 * lives on the subscription item (API versions since 2025-03-31).
 */
export function subscriptionRow(
    subscription: Stripe.Subscription,
): SubscriptionRow {
    const item = subscription.items.data[0];
    const plan = planForLookupKey(item?.price.lookup_key ?? null);
    const customer =
        typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
    return {
        stripe_customer_id: customer,
        stripe_subscription_id: subscription.id,
        // Unknown statuses, and prices that aren't one of our plans, grant
        // nothing rather than failing the write.
        status:
            KNOWN_STATUSES.has(subscription.status) && plan !== null
                ? subscription.status
                : "incomplete",
        plan,
        current_period_end: item
            ? new Date(item.current_period_end * 1000).toISOString()
            : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
    };
}

/** Events whose subscription the handler re-reads and records. */
export const HANDLED_EVENTS = new Set([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
]);

/** The subscription an event is about, if any. */
export function eventSubscriptionId(event: Stripe.Event): string | null {
    if (event.type === "checkout.session.completed") {
        const subscription = (event.data.object as Stripe.Checkout.Session)
            .subscription;
        return typeof subscription === "string"
            ? subscription
            : (subscription?.id ?? null);
    }
    return (event.data.object as Stripe.Subscription).id;
}
