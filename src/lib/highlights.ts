import "server-only";
import {
    insertOrExisting,
    mapAnnotatedVerse,
    readable,
    VERSE_EMBED,
    type AnnotatedVerse,
    type VerseEmbedRow,
} from "@/lib/annotations";
import { getUser } from "@/lib/auth";
import { resolveVerseRef, type ResolvedVerseRef } from "@/lib/bible/queries";
import { isHighlightColor, type HighlightColor } from "@/lib/highlight-colors";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseVerseRef } from "@/lib/verse-ref";

export interface Highlight extends AnnotatedVerse {
    id: string;
    color: HighlightColor;
    createdAt: string;
    updatedAt: string;
}

/** What the reader needs per highlighted verse. */
export interface VerseHighlight {
    id: string;
    color: HighlightColor;
}

const HIGHLIGHT_COLUMNS = `id, color, created_at, updated_at, ${VERSE_EMBED}`;

interface HighlightRow extends VerseEmbedRow {
    id: string;
    color: HighlightColor;
    created_at: string;
    updated_at: string;
}

function mapHighlight(row: HighlightRow): Highlight | null {
    const verse = mapAnnotatedVerse(row);
    if (!verse) return null;
    return {
        id: row.id,
        color: row.color,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...verse,
    };
}

// Every query below runs as the signed-in user, so RLS limits rows to
// their own highlights; there is deliberately no user_id filter to forget.

/** The user's highlights, most recently changed first. */
export async function listHighlights(filter?: {
    bookSlug: string;
    chapterNumber: number;
}): Promise<Highlight[]> {
    const supabase = await createClient();
    let query = supabase.from("highlights").select(HIGHLIGHT_COLUMNS);
    if (filter) {
        query = query
            .eq("books.slug", filter.bookSlug)
            .eq("chapter_number", filter.chapterNumber);
    }
    const { data, error } = await query.order("updated_at", {
        ascending: false,
    });
    if (error) throw error;
    return (data as unknown as HighlightRow[])
        .map(mapHighlight)
        .filter((item): item is Highlight => item !== null);
}

/** Verse number → highlight for one chapter, for the reader. */
export async function getChapterHighlights(
    bookId: number,
    chapterNumber: number,
): Promise<Record<number, VerseHighlight>> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("highlights")
        .select("id, color, verse_number")
        .eq("book_id", bookId)
        .eq("chapter_number", chapterNumber);
    if (error) throw error;
    return Object.fromEntries(
        (data ?? []).map((row) => [
            row.verse_number,
            { id: row.id, color: row.color as HighlightColor },
        ]),
    );
}

/**
 * Highlight a verse, or recolor it if it's already highlighted (one
 * highlight per verse). `created` says which happened.
 */
async function upsertHighlight(
    verse: ResolvedVerseRef,
    color: HighlightColor,
): Promise<{ highlight: Highlight; created: boolean }> {
    const supabase = await createClient();
    const { row, created } = await insertOrExisting<HighlightRow>(
        // user_id is left to its auth.uid() default; clients can't set it.
        () =>
            supabase
                .from("highlights")
                .insert({
                    translation_id: verse.translationId,
                    book_id: verse.bookId,
                    chapter_number: verse.chapterNumber,
                    verse_number: verse.verseNumber,
                    color,
                })
                .select(HIGHLIGHT_COLUMNS)
                .single(),
        // Not a PostgREST upsert: only `color` is updatable, and upsert
        // would try to set every inserted column.
        () =>
            supabase
                .from("highlights")
                .update({ color })
                .eq("book_id", verse.bookId)
                .eq("chapter_number", verse.chapterNumber)
                .eq("verse_number", verse.verseNumber)
                .select(HIGHLIGHT_COLUMNS)
                .maybeSingle(),
    );
    return { highlight: readable(mapHighlight(row)), created };
}

/** Delete one of the user's highlights; false when there was none. */
async function deleteHighlight(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("highlights")
        .delete()
        .eq("id", id)
        .select("id");
    if (error) throw error;
    return (data ?? []).length > 0;
}

// ── Mutations shared by the API routes and the Server Actions ────────────

/** Highlight (or recolor) from an untrusted `{ book, chapter, verse, color }`. */
export async function setHighlight(input: unknown): Promise<Result<Highlight>> {
    if (!(await getUser())) return fail(401, "Sign in to save highlights.");
    const ref = parseVerseRef(input);
    const color = (input as { color?: unknown } | null)?.color;
    if (!ref || !isHighlightColor(color)) {
        return fail(400, "Provide a book, chapter, verse and color.");
    }
    try {
        const verse = await resolveVerseRef(ref);
        if (!verse) return fail(404, "That verse doesn't exist.");
        const { highlight, created } = await upsertHighlight(verse, color);
        return ok(highlight, created ? 201 : 200);
    } catch {
        return fail(500, "Couldn't save the highlight. Please try again.");
    }
}

export async function removeHighlight(id: unknown): Promise<Result<null>> {
    if (!(await getUser())) return fail(401, "Sign in to manage highlights.");
    if (typeof id !== "string" || !isUuid(id)) {
        return fail(404, "Highlight not found.");
    }
    try {
        if (!(await deleteHighlight(id))) {
            return fail(404, "Highlight not found.");
        }
        return ok(null, 204);
    } catch {
        return fail(500, "Couldn't remove the highlight. Please try again.");
    }
}
