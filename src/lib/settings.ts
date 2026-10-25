import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ReadingMode } from "@/context/reading-mode";

export const FONT_SCALE_MIN = 80;
export const FONT_SCALE_MAX = 140;
export const FONT_SCALE_STEP = 10;

export interface UserSettings {
    readingMode: ReadingMode;
    fontScale: number;
    /** Translation slug, or null when they haven't picked one. */
    translation: string | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
    readingMode: "light",
    fontScale: 100,
    translation: null,
};

interface SettingsRow {
    reading_mode: ReadingMode;
    font_scale: number;
    translation: string | null;
}

/**
 * Signed-in user's settings, or defaults when they've never saved any.
 * Memoized per server render, so the layout and the reader share a query.
 */
export const getUserSettings = cache(
    async (userId: string): Promise<UserSettings> => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("user_settings")
            .select("reading_mode, font_scale, translation")
            .eq("user_id", userId)
            .maybeSingle();
        if (error) throw error;
        if (!data) return DEFAULT_SETTINGS;
        const row = data as SettingsRow;
        return {
            readingMode: row.reading_mode,
            fontScale: row.font_scale,
            translation: row.translation,
        };
    },
);

export async function saveUserSettings(
    userId: string,
    settings: Partial<UserSettings>,
): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("user_settings").upsert(
        {
            user_id: userId,
            ...(settings.readingMode && { reading_mode: settings.readingMode }),
            ...(settings.fontScale !== undefined && {
                font_scale: settings.fontScale,
            }),
            ...(settings.translation && {
                translation: settings.translation,
            }),
        },
        { onConflict: "user_id" },
    );
    if (error) throw error;
}
