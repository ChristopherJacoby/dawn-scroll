"use server";

import { revalidatePath } from "next/cache";
import { enroll, leave, setDayComplete } from "@/lib/reading-plans";
import type { Result } from "@/lib/result";

// Server Actions for the web UI; see src/app/bookmarks/actions.ts for why
// these purge the client router cache.

async function revalidating(result: Promise<Result<null>>) {
    const settled = await result;
    if (settled.ok) revalidatePath("/", "layout");
    return settled;
}

export async function enrollAction(slug: unknown): Promise<Result<null>> {
    return revalidating(enroll(slug));
}

export async function leaveAction(slug: unknown): Promise<Result<null>> {
    return revalidating(leave(slug));
}

export async function setDayCompleteAction(
    slug: unknown,
    day: unknown,
    complete: unknown,
): Promise<Result<null>> {
    return revalidating(setDayComplete(slug, day, complete === true));
}
