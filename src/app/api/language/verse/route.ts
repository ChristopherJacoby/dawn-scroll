import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { getVerseWordStudy } from "@/lib/language/queries";
import { parseVerseRef } from "@/lib/verse-ref";

const CACHE =
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * GET /api/language/verse?book=john&chapter=1&verse=1[&translation=kjv]
 * — the verse's display-token mappings, its Hebrew/Greek words, and the
 * Strong's entries and morphology they reference.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const ref = parseVerseRef({
        book: params.get("book"),
        chapter: Number(params.get("chapter")),
        verse: Number(params.get("verse")),
        translation: params.get("translation") ?? undefined,
    });
    if (!ref) return jsonError("Provide a book, chapter and verse.", 400);
    try {
        const study = await getVerseWordStudy(ref);
        if (!study) return jsonError("That verse doesn't exist.", 404);
        return Response.json(
            { study },
            { headers: { "Cache-Control": CACHE } },
        );
    } catch {
        return jsonError(
            "Couldn't load the original words. Please try again.",
            500,
        );
    }
}
