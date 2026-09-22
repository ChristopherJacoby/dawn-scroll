import type { Metadata } from "next";
import { DisplayNameForm } from "@/components/account/DisplayNameForm";
import { LogOutButton } from "@/components/auth/LogOutButton";
import { requireAuth } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profiles";

export const metadata: Metadata = {
    title: "Account | Dawnscroll",
};

function formatMemberSince(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

export default async function AccountPage({
    searchParams,
}: {
    searchParams: Promise<{ reset?: string }>;
}) {
    const user = await requireAuth("/account");
    const [profile, params] = await Promise.all([
        getOwnProfile(user.id),
        searchParams,
    ]);
    const memberSince = profile?.createdAt ?? user.created_at;

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Account
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        {profile?.displayName ?? "Your profile"}
                    </h1>
                </div>

                {params.reset === "1" && (
                    <p
                        role="status"
                        className="rounded-md border border-reading-border-strong bg-reading-surface-raised px-4 py-3 text-sm text-reading-text"
                    >
                        Your password has been updated.
                    </p>
                )}

                <section
                    aria-labelledby="profile-heading"
                    className="flex flex-col gap-5 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5"
                >
                    <h2
                        id="profile-heading"
                        className="text-xs font-medium uppercase tracking-wide text-reading-text-muted"
                    >
                        Profile
                    </h2>
                    <DisplayNameForm
                        key={profile?.displayName ?? ""}
                        initialName={profile?.displayName ?? null}
                    />
                    <dl className="grid gap-4 border-t border-reading-divider pt-5 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <dt className="text-xs font-medium text-reading-text-muted">
                                Email
                            </dt>
                            <dd className="text-base text-reading-text">
                                {user.email}
                            </dd>
                        </div>
                        <div className="flex flex-col gap-1">
                            <dt className="text-xs font-medium text-reading-text-muted">
                                Member since
                            </dt>
                            <dd className="text-base text-reading-text">
                                {formatMemberSince(memberSince)}
                            </dd>
                        </div>
                    </dl>
                </section>

                <div>
                    <LogOutButton />
                </div>
            </div>
        </div>
    );
}
