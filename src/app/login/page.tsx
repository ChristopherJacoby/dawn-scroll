import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LogInForm } from "@/components/auth/LogInForm";
import { getUser } from "@/lib/auth";
import { safeReturnPath } from "@/lib/auth-validation";

export const metadata: Metadata = {
    title: "Log in | Dawnscroll",
};

const LINK_ERRORS: Record<string, string> = {
    "invalid-link": "That link isn't valid. Please request a new one.",
    "expired-link": "That link has expired. Please request a new one.",
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
            <LogInForm
                next={next}
                initialError={
                    params.error ? LINK_ERRORS[params.error] : undefined
                }
            />
        </AuthShell>
    );
}
