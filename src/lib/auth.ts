import "server-only";
import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Current session from the request cookies. Cheap (no network round trip)
 * but NOT verified against the auth server — use it for display decisions,
 * never for authorization. Use `getUser` / `requireAuth` to gate anything.
 */
export async function getSession(): Promise<Session | null> {
    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session;
}

/**
 * Current user, verified against the auth server. This is the source of
 * truth for "is this request authenticated" — cookies can be forged, a
 * server-validated user cannot.
 */
export async function getUser(): Promise<User | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

/**
 * Gate a server component, route handler, or server action on a verified
 * user. Redirects to /login (preserving the destination) when there isn't
 * one, so callers can rely on the returned User being non-null.
 */
export async function requireAuth(returnTo?: string): Promise<User> {
    const user = await getUser();
    if (!user) {
        const target = returnTo
            ? `/login?next=${encodeURIComponent(returnTo)}`
            : "/login";
        redirect(target);
    }
    return user;
}
