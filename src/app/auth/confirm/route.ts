import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/auth-validation";

const OTP_TYPES: EmailOtpType[] = [
    "signup",
    "email",
    "recovery",
    "email_change",
    "magiclink",
];

/**
 * Landing route for Supabase email links (confirmation, recovery, email
 * change). Exchanges the link for a session server-side, so the cookie is
 * set before the user lands anywhere.
 *
 * Accepts both link shapes: `token_hash` + `type` (templates customized to
 * use `{{ .TokenHash }}`), and the PKCE `code` that Supabase's default
 * `{{ .ConfirmationURL }}` redirects back with. A code carries no type, so
 * callers put the destination in `next` (recovery uses /reset-password).
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const code = params.get("code");
    const next = safeReturnPath(params.get("next"));

    // Supabase redirects here with an error instead of a code when the
    // link was already used or has expired.
    if (params.get("error_code") === "otp_expired") {
        redirect("/login?error=expired-link");
    }

    const supabase = await createClient();

    if (code) {
        // Needs the code verifier cookie set when the email was requested,
        // so this fails if the link is opened in a different browser.
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        redirect(error ? "/login?error=expired-link" : next);
    }

    if (!tokenHash || !type || !OTP_TYPES.includes(type)) {
        redirect("/login?error=invalid-link");
    }

    const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
    });

    if (error) {
        redirect("/login?error=expired-link");
    }

    redirect(type === "recovery" ? "/reset-password" : next);
}
