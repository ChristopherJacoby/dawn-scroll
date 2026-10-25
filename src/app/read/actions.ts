"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { getEnabledTranslations } from "@/lib/bible/queries";
import { TRANSLATION_COOKIE } from "@/lib/bible/translation-preference";
import { fail, ok, type Result } from "@/lib/result";
import { saveUserSettings } from "@/lib/settings";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Switch the reader's translation. Saved in a cookie for this browser and,
 * when signed in, in the user's settings so other devices follow.
 */
export async function setTranslationAction(
    slug: unknown,
): Promise<Result<null>> {
    const translations = await getEnabledTranslations();
    if (
        typeof slug !== "string" ||
        !translations.some((t) => t.slug === slug)
    ) {
        return fail(400, "That translation isn't available.");
    }

    (await cookies()).set(TRANSLATION_COOKIE, slug, {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });

    const user = await getUser();
    if (user) {
        try {
            await saveUserSettings(user.id, { translation: slug });
        } catch {
            return fail(
                500,
                "We couldn't save your translation. Please try again.",
            );
        }
    }

    // Purges the client router cache too, so prefetched and back/forward
    // pages don't keep showing the previous translation.
    revalidatePath("/", "layout");
    return ok(null);
}
