import { resultResponse } from "@/lib/api";
import { getPlanProgress } from "@/lib/reading-plans";

/**
 * GET /api/plans/:slug/progress — `{ progress: { plan, enrolled,
 * completed: [{ dayNumber, completedAt }], currentDay } }`; 401 signed out.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    const { slug } = await params;
    return resultResponse(await getPlanProgress(slug), "progress");
}
