import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    // Skip static assets and images; everything else gets a session refresh.
    matcher: [
        // api/language and api/archaeology serve public, edge-cached
        // reference data: no session refresh there, so a cached response
        // can never carry a Set-Cookie.
        "/((?!_next/static|_next/image|favicon.ico|api/language|api/archaeology|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
