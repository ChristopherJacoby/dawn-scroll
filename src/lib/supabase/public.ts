import {
    createClient as createSupabaseClient,
    type SupabaseClient,
} from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Cookie-less client for public reference data (anon RLS only). Responses
 * built with it carry no session, so they can be cached and shared.
 */
export function createPublicClient(): SupabaseClient {
    client ??= createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return client;
}
