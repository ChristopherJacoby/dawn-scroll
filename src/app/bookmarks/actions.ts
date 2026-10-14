"use server";

import { revalidatePath } from "next/cache";
import { addBookmark, removeBookmark } from "@/lib/bookmarks";
import { ok, type Result } from "@/lib/result";

// The web UI mutates through Server Actions rather than the API routes:
// revalidatePath here purges the whole client router cache, so pages kept
// for back/forward navigation don't show a bookmark that's since changed.

/** Bookmark a verse; resolves to the bookmark's id. */
export async function addBookmarkAction(
    input: unknown,
): Promise<Result<string>> {
    const result = await addBookmark(input);
    if (!result.ok) return result;
    revalidatePath("/", "layout");
    return ok(result.value.id, result.status);
}

export async function removeBookmarkAction(id: unknown): Promise<Result<null>> {
    const result = await removeBookmark(id);
    if (result.ok) revalidatePath("/", "layout");
    return result;
}
