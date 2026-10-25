import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Google (via Supabase) sends the user back after OAuth sign-in.
 * Exchanges the code for a session cookie, then continues to `next`. A
 * missing code means the user cancelled or the provider refused.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const next = safeReturnPath(params.get("next"));
    const code = params.get("code");
    const retry = `/login?error=oauth&next=${encodeURIComponent(next)}`;
    if (!code) redirect(retry);

    // Needs the code verifier cookie set when sign-in started, so the flow
    // must finish in the browser that began it.
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    redirect(error ? retry : next);
}
