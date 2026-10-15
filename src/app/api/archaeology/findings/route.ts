import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { isCredibilityRating } from "@/lib/archaeology/credibility";
import { listFindings } from "@/lib/archaeology/queries";

const CACHE =
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE_SIZE = 24;

/**
 * GET /api/archaeology/findings[?book=exodus][&credibility=debated][&page=2]
 * — a page of finding summaries in catalog order, with the total count.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const book = params.get("book");
    const credibility = params.get("credibility");
    const page = params.get("page") ?? "1";

    if (book !== null && !SLUG.test(book)) {
        return jsonError("Unknown book.", 400);
    }
    if (credibility !== null && !isCredibilityRating(credibility)) {
        return jsonError(
            "Credibility must be established, supported, debated or unverified.",
            400,
        );
    }
    if (!/^[1-9]\d{0,3}$/.test(page)) {
        return jsonError("Page must be a positive number.", 400);
    }

    try {
        const { findings, total } = await listFindings({
            book: book ?? undefined,
            credibility: credibility ?? undefined,
            page: Number(page),
            pageSize: PAGE_SIZE,
        });
        return Response.json(
            { findings, total, page: Number(page), pageSize: PAGE_SIZE },
            { headers: { "Cache-Control": CACHE } },
        );
    } catch {
        return jsonError("Couldn't load findings. Please try again.", 500);
    }
}
