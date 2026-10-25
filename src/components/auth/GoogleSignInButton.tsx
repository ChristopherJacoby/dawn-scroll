"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/** Google's "G" mark, as its sign-in guidelines ask buttons to show. */
function GoogleMark() {
    return (
        <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
        </svg>
    );
}

/** Starts Google sign-in; Supabase returns the user to /auth/callback. */
export function GoogleSignInButton({ next }: { next: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function signIn() {
        setPending(true);
        setError(null);
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", next);
        const { error } = await createClient().auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: callback.toString() },
        });
        // On success the browser is already leaving for Google.
        if (error) {
            setPending(false);
            setError("Couldn't start Google sign-in. Please try again.");
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                loading={pending}
                onClick={signIn}
            >
                {!pending && <GoogleMark />}
                Continue with Google
            </Button>
            {error && (
                <p role="alert" className="text-sm text-reading-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

/** "or" between the Google button and the email form. */
export function AuthDivider() {
    return (
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-reading-text-muted">
            <span className="h-px flex-1 bg-reading-divider" />
            or
            <span className="h-px flex-1 bg-reading-divider" />
        </div>
    );
}
