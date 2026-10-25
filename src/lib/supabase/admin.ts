import "server-only";
import {
    createClient as createSupabaseClient,
    type SupabaseClient,
} from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Service-role client: bypasses RLS. Server-only, and only for writes no
 * user may make themselves, such as recording a Stripe subscription.
 */
export function createAdminClient(): SupabaseClient {
    client ??= createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return client;
}
