import "server-only";
import {
    mapAnnotatedVerse,
    VERSE_EMBED,
    type AnnotatedVerse,
    type VerseEmbedRow,
} from "@/lib/annotations";
import { getUser } from "@/lib/auth";
import { resolveVerseRef, type ResolvedVerseRef } from "@/lib/bible/queries";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseVerseRef } from "@/lib/verse-ref";

export interface Bookmark extends AnnotatedVerse {
    id: string;
    createdAt: string;
}

const BOOKMARK_COLUMNS = `id, created_at, ${VERSE_EMBED}`;

interface BookmarkRow extends VerseEmbedRow {
    id: string;
    created_at: string;
}

function mapBookmark(row: BookmarkRow): Bookmark {
    return {
        id: row.id,
        createdAt: row.created_at,
        ...mapAnnotatedVerse(row),
    };
}

// Every query below runs as the signed-in user, so RLS limits rows to
// their own bookmarks; there is deliberately no user_id filter to forget.

/** The user's bookmarks, newest first, optionally limited to one chapter. */
export async function listBookmarks(filter?: {
    bookSlug: string;
    chapterNumber: number;
}): Promise<Bookmark[]> {
    const supabase = await createClient();
    let query = supabase.from("bookmarks").select(BOOKMARK_COLUMNS);
    if (filter) {
        query = query
            .eq("books.slug", filter.bookSlug)
            .eq("chapter_number", filter.chapterNumber);
    }
    const { data, error } = await query.order("created_at", {
        ascending: false,
    });
    if (error) throw error;
    return (data as unknown as BookmarkRow[]).map(mapBookmark);
}

/** Verse number → bookmark id for one chapter, for the reader. */
export async function getChapterBookmarkIds(
    bookId: number,
    chapterNumber: number,
): Promise<Record<number, string>> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .select("id, verse_number")
        .eq("book_id", bookId)
        .eq("chapter_number", chapterNumber);
    if (error) throw error;
    return Object.fromEntries(
        (data ?? []).map((row) => [row.verse_number, row.id]),
    );
}

/**
 * Bookmark a verse. Idempotent: bookmarking an already-bookmarked verse
 * returns the existing bookmark with `created: false`.
 */
export async function createBookmark(
    verse: ResolvedVerseRef,
): Promise<{ bookmark: Bookmark; created: boolean }> {
    const supabase = await createClient();
    // user_id is left to its auth.uid() default; clients can't set it.
    const { data, error } = await supabase
        .from("bookmarks")
        .insert({
            translation_id: verse.translationId,
            book_id: verse.bookId,
            chapter_number: verse.chapterNumber,
            verse_number: verse.verseNumber,
        })
        .select(BOOKMARK_COLUMNS)
        .single();

    if (!error) {
        return {
            bookmark: mapBookmark(data as unknown as BookmarkRow),
            created: true,
        };
    }
    if (error.code !== "23505") throw error;

    const existing = await supabase
        .from("bookmarks")
        .select(BOOKMARK_COLUMNS)
        .eq("book_id", verse.bookId)
        .eq("chapter_number", verse.chapterNumber)
        .eq("verse_number", verse.verseNumber)
        .single();
    if (existing.error) throw existing.error;
    return {
        bookmark: mapBookmark(existing.data as unknown as BookmarkRow),
        created: false,
    };
}

/** Delete one of the user's bookmarks; false when there was none to delete. */
export async function deleteBookmark(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .select("id");
    if (error) throw error;
    return (data ?? []).length > 0;
}

// ── Mutations as the signed-in user ──────────────────────────────────────
// Shared by the API routes and the Server Actions: auth, validation and
// error mapping live here once.

/** Bookmark the verse described by an untrusted `{ book, chapter, verse }`. */
export async function addBookmark(input: unknown): Promise<Result<Bookmark>> {
    if (!(await getUser())) return fail(401, "Sign in to save bookmarks.");
    const ref = parseVerseRef(input);
    if (!ref) return fail(400, "Provide a book, chapter and verse.");
    try {
        const verse = await resolveVerseRef(ref);
        if (!verse) return fail(404, "That verse doesn't exist.");
        const { bookmark, created } = await createBookmark(verse);
        return ok(bookmark, created ? 201 : 200);
    } catch {
        return fail(500, "Couldn't save the bookmark. Please try again.");
    }
}

/** Remove one of the user's bookmarks by id. */
export async function removeBookmark(id: unknown): Promise<Result<null>> {
    if (!(await getUser())) return fail(401, "Sign in to manage bookmarks.");
    if (typeof id !== "string" || !isUuid(id)) {
        return fail(404, "Bookmark not found.");
    }
    try {
        if (!(await deleteBookmark(id))) {
            return fail(404, "Bookmark not found.");
        }
        return ok(null, 204);
    } catch {
        return fail(500, "Couldn't remove the bookmark. Please try again.");
    }
}
