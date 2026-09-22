import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: string;
}

interface ProfileRow {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
}

function mapProfile(row: ProfileRow): Profile {
    return {
        id: row.id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
    };
}

/** The signed-in user's own profile (RLS scopes the query). */
export async function getOwnProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    return data ? mapProfile(data as ProfileRow) : null;
}

export async function updateOwnDisplayName(
    userId: string,
    displayName: string | null,
): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId);
    if (error) throw error;
}
