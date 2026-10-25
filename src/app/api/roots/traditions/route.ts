import { jsonError } from "@/lib/api";
import { listTraditions } from "@/lib/roots/queries";

const CACHE =
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

/** GET /api/roots/traditions — every tradition's slug, name and summary. */
export async function GET() {
    try {
        const traditions = await listTraditions();
        return Response.json(
            { traditions },
            { headers: { "Cache-Control": CACHE } },
        );
    } catch {
        return jsonError("Couldn't load traditions. Please try again.", 500);
    }
}
