import { headers } from "next/headers";
import { jsonError, rejectUntrustedMutation, unauthorized } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/subscriptions/portal — a Stripe Customer Portal session where
 * the signed-in user can change or cancel their plan. Returns `{ url }`.
 */
export async function POST(request: Request) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const user = await getUser();
    if (!user) return unauthorized();
    const stripe = getStripe();
    if (!stripe) return jsonError("Subscriptions aren't available yet.", 503);

    try {
        const { data, error } = await createAdminClient()
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .maybeSingle();
        if (error) throw error;
        if (!data?.stripe_customer_id)
            return jsonError("You don't have a subscription yet.", 404);

        const h = await headers();
        const host =
            h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
        const proto = h.get("x-forwarded-proto") ?? "http";
        const session = await stripe.billingPortal.sessions.create({
            customer: data.stripe_customer_id,
            return_url: `${proto}://${host}/account/subscription`,
        });
        return Response.json({ url: session.url });
    } catch {
        return jsonError(
            "Couldn't open subscription management. Please try again.",
            500,
        );
    }
}
