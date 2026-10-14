import type { NextRequest } from "next/server";
import {
    jsonError,
    readJson,
    rejectUntrustedMutation,
    resultResponse,
    unauthorized,
} from "@/lib/api";
import { getUser } from "@/lib/auth";
import { listNotes, saveNote } from "@/lib/notes";
import { parseVerseRef } from "@/lib/verse-ref";

/**
 * GET /api/notes — the user's notes, most recently edited first.
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
        return Response.json({ notes: await listNotes(filter) });
    } catch {
        return jsonError("Couldn't load notes. Please try again.", 500);
    }
}

/**
 * POST /api/notes — `{ book, chapter, verse, translation?, content }`.
 * One note per verse: 201 when created, 200 when it replaces the verse's
 * existing note.
 */
export async function POST(request: Request) {
    const rejected = rejectUntrustedMutation(request, { hasBody: true });
    if (rejected) return rejected;
    return resultResponse(await saveNote(await readJson(request)), "note");
}
