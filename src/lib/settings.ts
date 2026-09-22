import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ReadingMode } from "@/context/reading-mode";

export const FONT_SCALE_MIN = 80;
export const FONT_SCALE_MAX = 140;
export const FONT_SCALE_STEP = 10;

export interface UserSettings {
    readingMode: ReadingMode;
    fontScale: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
    readingMode: "light",
    fontScale: 100,
};

interface SettingsRow {
    reading_mode: ReadingMode;
    font_scale: number;
}

/** Signed-in user's settings, or defaults when they've never saved any. */
export async function getUserSettings(userId: string): Promise<UserSettings> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("user_settings")
        .select("reading_mode, font_scale")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;
    const row = data as SettingsRow;
    return { readingMode: row.reading_mode, fontScale: row.font_scale };
}

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
        },
        { onConflict: "user_id" },
    );
    if (error) throw error;
}
