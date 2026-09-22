import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
    title: "Reset password | Dawnscroll",
};

export default function ForgotPasswordPage() {
    return (
        <AuthShell title="Reset your password">
            <ForgotPasswordForm />
        </AuthShell>
    );
}
