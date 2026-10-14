"use server";

import { revalidatePath } from "next/cache";
import {
    removeHighlight,
    setHighlight,
    type VerseHighlight,
} from "@/lib/highlights";
import { ok, type Result } from "@/lib/result";

// Server Actions for the web UI; see src/app/bookmarks/actions.ts for why
// these purge the client router cache.

export async function setHighlightAction(
    input: unknown,
): Promise<Result<VerseHighlight>> {
    const result = await setHighlight(input);
    if (!result.ok) return result;
    revalidatePath("/", "layout");
    return ok(
        { id: result.value.id, color: result.value.color },
        result.status,
    );
}

export async function removeHighlightAction(
    id: unknown,
): Promise<Result<null>> {
    const result = await removeHighlight(id);
    if (result.ok) revalidatePath("/", "layout");
    return result;
}
