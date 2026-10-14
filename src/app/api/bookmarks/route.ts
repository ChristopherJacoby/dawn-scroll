import type { NextRequest } from "next/server";
import { jsonError, readJson, unauthorized } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { resolveVerseRef } from "@/lib/bible/queries";
import { createBookmark, listBookmarks } from "@/lib/bookmarks";
import { parseVerseRef } from "@/lib/verse-ref";

/**
 * GET /api/bookmarks — the user's bookmarks, newest first.
 * Optional `?book=john&chapter=3` limits the list to one chapter.
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
        return Response.json({ bookmarks: await listBookmarks(filter) });
    } catch {
        return jsonError("Couldn't load bookmarks. Please try again.", 500);
    }
}

/**
 * POST /api/bookmarks — `{ book, chapter, verse, translation? }`.
 * 201 with the new bookmark, or 200 with the existing one if the verse was
 * already bookmarked.
 */
export async function POST(request: Request) {
    const user = await getUser();
    if (!user) return unauthorized();

    const ref = parseVerseRef(await readJson(request));
    if (!ref) {
        return jsonError("Provide a book, chapter and verse.", 400);
    }

    try {
        const verse = await resolveVerseRef(ref);
        if (!verse) return jsonError("That verse doesn't exist.", 404);
        const { bookmark, created } = await createBookmark(user.id, verse);
        return Response.json({ bookmark }, { status: created ? 201 : 200 });
    } catch {
        return jsonError("Couldn't save the bookmark. Please try again.", 500);
    }
}
