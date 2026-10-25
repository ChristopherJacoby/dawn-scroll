import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { eventTarget, subscriptionRow } from "./webhook";

const subscription = (overrides: Partial<Stripe.Subscription> = {}) =>
    ({
        id: "sub_1",
        customer: "cus_1",
        status: "trialing",
        cancel_at_period_end: false,
        metadata: { user_id: "user-1" },
        items: {
            data: [
                {
                    current_period_end: 1_800_000_000,
                    price: { lookup_key: "dawnscroll_premium_annual" },
                },
            ],
        },
        ...overrides,
    }) as unknown as Stripe.Subscription;

describe("subscriptionRow", () => {
    it("maps a subscription, reading the period from its item", () => {
        expect(subscriptionRow(subscription())).toEqual({
            stripe_customer_id: "cus_1",
            stripe_subscription_id: "sub_1",
            status: "trialing",
            plan: "annual",
            current_period_end: new Date(1_800_000_000_000).toISOString(),
            cancel_at_period_end: false,
        });
    });

    it("treats unknown statuses and prices as granting nothing", () => {
        const row = subscriptionRow(
            subscription({
                status: "some_new_status" as Stripe.Subscription.Status,
            }),
        );
        expect(row.status).toBe("incomplete");
        const other = subscriptionRow(
            subscription({
                items: {
                    data: [
                        {
                            current_period_end: 1,
                            price: { lookup_key: "other" },
                        },
                    ],
                } as never,
            }),
        );
        expect(other.plan).toBeNull();
    });
});

describe("eventTarget", () => {
    it("reads the user from a checkout session and from subscription metadata", () => {
        expect(
            eventTarget({
                type: "checkout.session.completed",
                data: {
                    object: {
                        subscription: "sub_9",
                        client_reference_id: "user-9",
                    },
                },
            } as unknown as Stripe.Event),
        ).toEqual({ subscriptionId: "sub_9", userId: "user-9" });
        expect(
            eventTarget({
                type: "customer.subscription.updated",
                data: { object: subscription() },
            } as unknown as Stripe.Event),
        ).toEqual({ subscriptionId: "sub_1", userId: "user-1" });
    });
});

describe("webhook signatures", () => {
    const stripe = new Stripe("sk_test_dummy");
    const secret = "whsec_test";
    const payload = JSON.stringify({
        id: "evt_1",
        type: "customer.subscription.updated",
        data: { object: {} },
    });

    it("accepts a correctly signed payload and rejects a tampered one", () => {
        const header = stripe.webhooks.generateTestHeaderString({
            payload,
            secret,
        });
        expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe(
            "evt_1",
        );
        expect(() =>
            stripe.webhooks.constructEvent(
                payload.replace("evt_1", "evt_2"),
                header,
                secret,
            ),
        ).toThrow();
    });
});
