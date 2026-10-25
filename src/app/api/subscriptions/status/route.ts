import { jsonError } from "@/lib/api";
import { getSubscriptionStatus } from "@/lib/premium/subscription";

/** GET /api/subscriptions/status — the visitor's premium access. */
export async function GET() {
    try {
        const status = await getSubscriptionStatus();
        return Response.json(status, {
            headers: { "Cache-Control": "private, no-store" },
        });
    } catch {
        return jsonError("Couldn't load your subscription.", 500);
    }
}
