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
 * change). Exchanges the token hash for a session server-side, so the
 * cookie is set before the user lands anywhere.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const next = safeReturnPath(params.get("next"));

    if (!tokenHash || !type || !OTP_TYPES.includes(type)) {
        redirect("/login?error=invalid-link");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
    });

    if (error) {
        redirect("/login?error=expired-link");
    }

    redirect(type === "recovery" ? "/reset-password" : next);
}
