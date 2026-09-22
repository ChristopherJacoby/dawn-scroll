import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
    title: "Check your email | Dawnscroll",
};

export default async function CheckEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string }>;
}) {
    const { email } = await searchParams;

    return (
        <AuthShell title="Check your email">
            <div className="flex flex-col gap-4 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5">
                <MailCheck
                    className="h-8 w-8 text-reading-citation"
                    aria-hidden="true"
                />
                <p className="text-base text-reading-text">
                    We sent a confirmation link
                    {email ? (
                        <>
                            {" "}
                            to <strong className="font-medium">{email}</strong>
                        </>
                    ) : null}
                    . Open it to finish creating your account.
                </p>
                <p className="text-sm text-reading-text-muted">
                    Didn&apos;t get it? Check your spam folder, or wait a minute
                    and try signing up again.
                </p>
            </div>
        </AuthShell>
    );
}
