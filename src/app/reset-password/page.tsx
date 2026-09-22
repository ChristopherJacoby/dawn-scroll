import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Choose a new password | Dawnscroll",
};

// Reached from the recovery email via /auth/confirm, which has already
// exchanged the link for a session — so an unauthenticated visitor here
// has an invalid or expired link.
export default async function ResetPasswordPage() {
    if (!(await getUser())) redirect("/login?error=expired-link");

    return (
        <AuthShell title="Choose a new password">
            <ResetPasswordForm />
        </AuthShell>
    );
}
