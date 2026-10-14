import type { NextRequest } from "next/server";
import {
    jsonError,
    readJson,
    rejectUntrustedMutation,
    resultResponse,
    unauthorized,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import { listHighlights, setHighlight } from "@/lib/highlights";
import { parseVerseRef } from "@/lib/verse-ref";

/**
 * GET /api/highlights — the user's highlights, most recently changed
 * first. Optional `?book=john&chapter=3` limits the list to one chapter.
 */
export async function GET(request: NextRequest) {
    if (!(await getUser())) return unauthorized();

    const params = request.nextUrl.searchParams;
    const book = params.get("book");
    const chapter = params.get("chapter");
    let filter: { bookSlug: string; chapterNumber: number } | undefined;
    if (book !== null || chapter !== null) {
        const ref = parseVerseRef({ book, chapter: Number(chapter), verse: 1 });
        if (!ref) {
            return jsonError("Provide both a valid book and chapter.", 400);
        }
        filter = { bookSlug: ref.book, chapterNumber: ref.chapter };
    }

    try {
        return Response.json({ highlights: await listHighlights(filter) });
    } catch {
        return jsonError("Couldn't load highlights. Please try again.", 500);
    }
}

/**
 * POST /api/highlights — `{ book, chapter, verse, translation?, color }`
 * where color is yellow | green | blue | pink | purple. 201 when the verse
 * is newly highlighted, 200 when an existing highlight is recolored.
 */
export async function POST(request: Request) {
    const rejected = rejectUntrustedMutation(request, { hasBody: true });
    if (rejected) return rejected;
    return resultResponse(
        await setHighlight(await readJson(request)),
        "highlight",
    );
}
