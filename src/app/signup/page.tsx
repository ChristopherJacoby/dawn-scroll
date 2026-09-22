import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getUser } from "@/lib/auth";
import { safeReturnPath } from "@/lib/auth-validation";

export const metadata: Metadata = {
    title: "Create account | Dawnscroll",
};

export default async function SignUpPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const next = safeReturnPath((await searchParams).next);
    if (await getUser()) redirect(next);

    return (
        <AuthShell title="Create your account">
            <SignUpForm next={next} />
        </AuthShell>
    );
}
