import type { NextRequest } from "next/server";
import {
    DEFAULT_TRANSLATION,
    getEnabledTranslations,
    searchVerses,
} from "@/lib/bible/queries";

const MAX_QUERY_LENGTH = 200;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseLimit(value: string | null) {
    if (!value || !/^\d+$/.test(value)) return DEFAULT_LIMIT;
    return Math.min(Math.max(Number(value), 1), MAX_LIMIT);
}

/**
 * GET /api/bible/search?q=…[&translation=kjv][&limit=20]. The translation
 * is always explicit, never read from the reader's cookie, so a response
 * depends only on its URL.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const query = (params.get("q") ?? "").trim();
    const limit = parseLimit(params.get("limit"));
    const translation = params.get("translation") ?? DEFAULT_TRANSLATION;

    if (!query) {
        return Response.json({ query, results: [] });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return Response.json(
            {
                error: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
            },
            { status: 400 },
        );
    }

    try {
        // Unknown and disabled translations match nothing in SQL anyway;
        // the list only turns that into a clear error, so fetch both at once.
        const [translations, results] = await Promise.all([
            getEnabledTranslations(),
            searchVerses(query, translation, limit),
        ]);
        if (!translations.some((t) => t.slug === translation)) {
            return Response.json(
                { error: "That translation isn't available." },
                { status: 400 },
            );
        }
        return Response.json({ query, translation, results });
    } catch {
        return Response.json(
            { error: "Search is unavailable right now. Please try again." },
            { status: 500 },
        );
    }
}
