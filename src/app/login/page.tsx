import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
    AuthDivider,
    GoogleSignInButton,
} from "@/components/auth/GoogleSignInButton";
import { LogInForm } from "@/components/auth/LogInForm";
import { getUser } from "@/lib/auth";
import { isGoogleSignInEnabled } from "@/lib/auth-providers";
import { safeReturnPath } from "@/lib/auth-validation";

export const metadata: Metadata = {
    title: "Log in | Dawnscroll",
};

const LINK_ERRORS: Record<string, string> = {
    "invalid-link": "That link isn't valid. Please request a new one.",
    "expired-link": "That link has expired. Please request a new one.",
    oauth: "Google sign-in didn't finish. Please try again.",
};

export default async function LogInPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string; error?: string }>;
}) {
    const params = await searchParams;
    const next = safeReturnPath(params.next);
    if (await getUser()) redirect(next);

    return (
        <AuthShell title="Log in">
            {(await isGoogleSignInEnabled()) && (
                <>
                    <GoogleSignInButton next={next} />
                    <AuthDivider />
                </>
            )}
            <LogInForm
                next={next}
                initialError={
                    params.error ? LINK_ERRORS[params.error] : undefined
                }
            />
        </AuthShell>
    );
}
