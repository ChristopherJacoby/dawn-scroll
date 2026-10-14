"use server";

import { revalidatePath } from "next/cache";
import { removeNote, saveNote, type VerseNote } from "@/lib/notes";
import { ok, type Result } from "@/lib/result";

// Server Actions for the web UI; see src/app/bookmarks/actions.ts for why
// these purge the client router cache.

/** Save a verse's note; blank text deletes it (resolves to undefined). */
export async function saveNoteAction(
    input: unknown,
): Promise<Result<VerseNote | undefined>> {
    const result = await saveNote(input, { blankDeletes: true });
    if (!result.ok) return result;
    revalidatePath("/", "layout");
    const note = result.value;
    return ok(note ? { id: note.id, content: note.content } : undefined);
}

export async function removeNoteAction(id: unknown): Promise<Result<null>> {
    const result = await removeNote(id);
    if (result.ok) revalidatePath("/", "layout");
    return result;
}
