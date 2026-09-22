import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Account | Dawnscroll",
};

// Gated route; grows into the Profile page in DS-024.
export default async function AccountPage() {
    const user = await requireAuth("/account");

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-5 py-16 md:px-10">
                <h1 className="font-serif text-4xl leading-tight text-reading-text">
                    Account
                </h1>
                <p className="text-sm text-reading-text-muted">
                    Signed in as {user.email}
                </p>
            </div>
        </div>
    );
}
