import "server-only";
import type { ResolvedVerseRef } from "@/lib/bible/queries";
import { createClient } from "@/lib/supabase/server";

export interface Bookmark {
    id: string;
    bookSlug: string;
    bookName: string;
    bookOrder: number;
    chapterNumber: number;
    verseNumber: number;
    translation: string;
    text: string;
    createdAt: string;
}

const BOOKMARK_COLUMNS =
    "id, chapter_number, verse_number, created_at, books!inner(slug, name, book_order), translations(abbreviation), verses(verse_text)";

interface BookmarkRow {
    id: string;
    chapter_number: number;
    verse_number: number;
    created_at: string;
    books: { slug: string; name: string; book_order: number };
    translations: { abbreviation: string };
    verses: { verse_text: string };
}

function mapBookmark(row: BookmarkRow): Bookmark {
    return {
        id: row.id,
        bookSlug: row.books.slug,
        bookName: row.books.name,
        bookOrder: row.books.book_order,
        chapterNumber: row.chapter_number,
        verseNumber: row.verse_number,
        translation: row.translations.abbreviation,
        text: row.verses.verse_text,
        createdAt: row.created_at,
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
    userId: string,
    verse: ResolvedVerseRef,
): Promise<{ bookmark: Bookmark; created: boolean }> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .insert({
            user_id: userId,
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
