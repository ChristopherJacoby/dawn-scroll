import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Log in | Dawnscroll",
};

// Placeholder redirect target for requireAuth(); the form ships in DS-021.
export default function LoginPage() {
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-5 py-16 md:px-10">
                <h1 className="font-serif text-4xl leading-tight text-reading-text">
                    Log in
                </h1>
                <p className="text-sm text-reading-text-muted">
                    Accounts are coming soon.
                </p>
            </div>
        </div>
    );
}
