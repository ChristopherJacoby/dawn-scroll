import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every matched request so server
 * components always see a valid access token. Without this, tokens expire
 * in the cookie and server-side `getUser` starts returning null after an
 * hour even though the user is still "logged in" client-side.
 *
 * Must be called from `src/proxy.ts` and its returned response must be
 * the one sent — it carries the refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // Do not add logic between client creation and getUser: the call is
    // what triggers the token refresh that setAll writes back.
    await supabase.auth.getUser();

    return response;
}
