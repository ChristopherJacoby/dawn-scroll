import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { getStrongsEntry } from "@/lib/language/queries";
import { normalizeStrongs } from "@/lib/language/text";

// Reference data that changes only when re-imported: cache at the edge.
const CACHE =
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * GET /api/language/word?strongs=G3056 — the Strong's entry: original
 * characters, transliteration, pronunciation, definition, KJV usage.
 */
export async function GET(request: NextRequest) {
    const number = normalizeStrongs(
        request.nextUrl.searchParams.get("strongs") ?? "",
    );
    if (!number) {
        return jsonError("Provide a Strong's number like G3056 or H7225.", 400);
    }
    try {
        const entry = await getStrongsEntry(number);
        if (!entry)
            return jsonError("No Strong's entry with that number.", 404);
        return Response.json(
            { entry },
            { headers: { "Cache-Control": CACHE } },
        );
    } catch {
        return jsonError("Couldn't load that word. Please try again.", 500);
    }
}
