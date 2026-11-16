import {
    jsonError,
    readJson,
    rejectUntrustedMutation,
    unauthorized,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import { checkoutSessionParams } from "@/lib/premium/checkout";
import { isPlanKey } from "@/lib/premium/plans";
import { getSubscriptionRecord } from "@/lib/premium/subscription";
import { siteOrigin } from "@/lib/site-url";
import { getPriceId, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Statuses of a subscription that exists but whose payment is failing. */
const NEEDS_PAYMENT_FIX = new Set(["past_due", "unpaid", "paused"]);

/**
 * POST /api/subscriptions/checkout — `{ plan: "monthly" | "annual" }`.
 * Starts a Stripe Checkout Session for the signed-in user and returns its
 * `{ url }`.
 */
export async function POST(request: Request) {
    const rejected = rejectUntrustedMutation(request, { hasBody: true });
    if (rejected) return rejected;
    const user = await getUser();
    if (!user) return unauthorized();

    const plan = ((await readJson(request)) as { plan?: unknown } | undefined)
        ?.plan;
    if (!isPlanKey(plan))
        return jsonError("Choose the monthly or annual plan.", 400);

    const stripe = getStripe();
    if (!stripe) return jsonError("Subscriptions aren't available yet.", 503);

    try {
        // Read the record directly: whether Premium gating is on or not, a
        // subscriber shouldn't be able to buy a second subscription.
        const current = await getSubscriptionRecord();
        if (current.isPremium) {
            return jsonError("You already have Premium.", 409);
        }
        // Stripe is still retrying this subscription's payment. A second
        // checkout would start a second subscription, and both would bill
        // once the retry succeeds.
        if (NEEDS_PAYMENT_FIX.has(current.status)) {
            return jsonError(
                "Your subscription has a payment problem. Update your payment method from your account's subscription page.",
                409,
            );
        }
        const priceId = await getPriceId(stripe, plan);
        if (!priceId)
            return jsonError("Subscriptions aren't available yet.", 503);

        // One Stripe customer per user, remembered on their subscription row.
        const admin = createAdminClient();
        const { data: row, error } = await admin
            .from("subscriptions")
            .select("stripe_customer_id, stripe_subscription_id")
            .eq("user_id", user.id)
            .maybeSingle();
        if (error) throw error;
        let customerId: string | null = row?.stripe_customer_id ?? null;
        if (!customerId) {
            // Keyed per user, so two checkouts started at once get the
            // same customer. Otherwise the row keeps one customer while
            // the user may pay as the other, and the webhook can't match
            // that payment to anyone.
            const customer = await stripe.customers.create(
                {
                    email: user.email,
                    metadata: { user_id: user.id },
                },
                { idempotencyKey: `customer-${user.id}` },
            );
            customerId = customer.id;
            const { error: saveError } = await admin
                .from("subscriptions")
                .upsert(
                    { user_id: user.id, stripe_customer_id: customerId },
                    { onConflict: "user_id" },
                );
            if (saveError) throw saveError;
        }

        const session = await stripe.checkout.sessions.create(
            checkoutSessionParams({
                customerId,
                priceId,
                userId: user.id,
                origin: await siteOrigin(),
                offerTrial: !row?.stripe_subscription_id,
            }),
        );
        if (!session.url) throw new Error("Checkout session has no URL.");
        return Response.json({ url: session.url });
    } catch {
        return jsonError("Couldn't start checkout. Please try again.", 500);
    }
}
