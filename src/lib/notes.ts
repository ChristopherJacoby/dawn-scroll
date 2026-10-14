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
import { parseNoteContent } from "@/lib/note-content";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseVerseRef } from "@/lib/verse-ref";

export interface Note extends AnnotatedVerse {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

/** What the reader needs per verse with a note. */
export interface VerseNote {
    id: string;
    content: string;
}

const NOTE_COLUMNS = `id, content, created_at, updated_at, ${VERSE_EMBED}`;

interface NoteRow extends VerseEmbedRow {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

function mapNote(row: NoteRow): Note | null {
    const verse = mapAnnotatedVerse(row);
    if (!verse) return null;
    return {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...verse,
    };
}

// Every query below runs as the signed-in user, so RLS limits rows to
// their own notes; there is deliberately no user_id filter to forget.

/** The user's notes, most recently edited first. */
export async function listNotes(filter?: {
    bookSlug: string;
    chapterNumber: number;
}): Promise<Note[]> {
    const supabase = await createClient();
    let query = supabase.from("notes").select(NOTE_COLUMNS);
    if (filter) {
        query = query
            .eq("books.slug", filter.bookSlug)
            .eq("chapter_number", filter.chapterNumber);
    }
    const { data, error } = await query.order("updated_at", {
        ascending: false,
    });
    if (error) throw error;
    return (data as unknown as NoteRow[])
        .map(mapNote)
        .filter((note): note is Note => note !== null);
}

/** Verse number → note for one chapter, for the reader. */
export async function getChapterNotes(
    bookId: number,
    chapterNumber: number,
): Promise<Record<number, VerseNote>> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("notes")
        .select("id, content, verse_number")
        .eq("book_id", bookId)
        .eq("chapter_number", chapterNumber);
    if (error) throw error;
    return Object.fromEntries(
        (data ?? []).map((row) => [
            row.verse_number,
            { id: row.id, content: row.content },
        ]),
    );
}

/** Create the verse's note, or replace its text if it already has one. */
async function writeVerseNote(
    verse: ResolvedVerseRef,
    content: string,
): Promise<{ note: Note; created: boolean }> {
    const supabase = await createClient();
    const { row, created } = await insertOrExisting<NoteRow>(
        // user_id is left to its auth.uid() default; clients can't set it.
        () =>
            supabase
                .from("notes")
                .insert({
                    translation_id: verse.translationId,
                    book_id: verse.bookId,
                    chapter_number: verse.chapterNumber,
                    verse_number: verse.verseNumber,
                    content,
                })
                .select(NOTE_COLUMNS)
                .single(),
        () =>
            supabase
                .from("notes")
                .update({ content })
                .eq("book_id", verse.bookId)
                .eq("chapter_number", verse.chapterNumber)
                .eq("verse_number", verse.verseNumber)
                .select(NOTE_COLUMNS)
                .maybeSingle(),
    );
    return { note: readable(mapNote(row)), created };
}

// ── Mutations shared by the API routes and the Server Actions ────────────

async function resolveInput(
    input: unknown,
): Promise<Result<{ verse: ResolvedVerseRef; content: string }>> {
    const ref = parseVerseRef(input);
    const content = parseNoteContent(
        (input as { content?: unknown } | null)?.content,
    );
    if (!ref || content === null) {
        return fail(400, "Provide a book, chapter, verse and note text.");
    }
    const verse = await resolveVerseRef(ref);
    if (!verse) return fail(404, "That verse doesn't exist.");
    return ok({ verse, content });
}

/**
 * Save a verse's note from an untrusted `{ book, chapter, verse, content }`
 * (201 created, 200 replaced). Blank content is a 400 unless
 * `blankDeletes`, in which case the verse's note is deleted (204).
 */
export async function saveNote(
    input: unknown,
    { blankDeletes = false } = {},
): Promise<Result<Note | null>> {
    if (!(await getUser())) return fail(401, "Sign in to save notes.");
    try {
        const resolved = await resolveInput(input);
        if (!resolved.ok) return resolved;
        const { verse, content } = resolved.value;
        if (!content) {
            if (!blankDeletes) return fail(400, "A note can't be blank.");
            const supabase = await createClient();
            const { error } = await supabase
                .from("notes")
                .delete()
                .eq("book_id", verse.bookId)
                .eq("chapter_number", verse.chapterNumber)
                .eq("verse_number", verse.verseNumber);
            if (error) throw error;
            return ok(null, 204);
        }
        const { note, created } = await writeVerseNote(verse, content);
        return ok(note, created ? 201 : 200);
    } catch {
        return fail(500, "Couldn't save the note. Please try again.");
    }
}

/** Replace a note's text by id (PUT). */
export async function editNote(
    id: unknown,
    input: unknown,
): Promise<Result<Note>> {
    if (!(await getUser())) return fail(401, "Sign in to edit notes.");
    if (typeof id !== "string" || !isUuid(id)) {
        return fail(404, "Note not found.");
    }
    const content = parseNoteContent(
        (input as { content?: unknown } | null)?.content,
    );
    if (content === null) return fail(400, "Provide the note text.");
    if (!content) return fail(400, "A note can't be blank; delete it instead.");
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("notes")
            .update({ content })
            .eq("id", id)
            .select(NOTE_COLUMNS)
            .maybeSingle();
        if (error) throw error;
        if (!data) return fail(404, "Note not found.");
        return ok(readable(mapNote(data as unknown as NoteRow)));
    } catch {
        return fail(500, "Couldn't save the note. Please try again.");
    }
}

export async function removeNote(id: unknown): Promise<Result<null>> {
    if (!(await getUser())) return fail(401, "Sign in to manage notes.");
    if (typeof id !== "string" || !isUuid(id)) {
        return fail(404, "Note not found.");
    }
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("notes")
            .delete()
            .eq("id", id)
            .select("id");
        if (error) throw error;
        if ((data ?? []).length === 0) return fail(404, "Note not found.");
        return ok(null, 204);
    } catch {
        return fail(500, "Couldn't delete the note. Please try again.");
    }
}
