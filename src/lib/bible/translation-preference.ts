import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/settings";
import { DEFAULT_TRANSLATION, getEnabledTranslations } from "./queries";
import type { Translation } from "./types";

/** This browser's translation choice; the only one when signed out. */
export const TRANSLATION_COOKIE = "dawnscroll-translation";

/**
 * The translation to read in: a signed-in user's saved choice, else this
 * browser's cookie, else the KJV. A choice that's no longer enabled is
 * skipped. Null only when not even the KJV is available.
 */
export const getPreferredTranslation = cache(
    async (): Promise<Translation | null> => {
        const [translations, user, cookieStore] = await Promise.all([
            getEnabledTranslations(),
            getUser(),
            cookies(),
        ]);
        const saved = user
            ? (await getUserSettings(user.id)).translation
            : null;
        for (const slug of [
            saved,
            cookieStore.get(TRANSLATION_COOKIE)?.value,
            DEFAULT_TRANSLATION,
        ]) {
            const match = translations.find((t) => t.slug === slug);
            if (match) return match;
        }
        return null;
    },
);
