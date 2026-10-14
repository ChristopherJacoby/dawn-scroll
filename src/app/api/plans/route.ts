import { jsonError } from "@/lib/api";
import { listPlans } from "@/lib/reading-plans";

/** GET /api/plans — the public reading plan catalog. */
export async function GET() {
    try {
        return Response.json({ plans: await listPlans() });
    } catch {
        return jsonError("Couldn't load reading plans. Please try again.", 500);
    }
}
