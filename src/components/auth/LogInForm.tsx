"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logIn, type LogInState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export function LogInForm({
    next,
    initialError,
}: {
    next: string;
    initialError?: string;
}) {
    const [state, action, pending] = useActionState<LogInState, FormData>(
        logIn,
        initialError ? { errors: { form: initialError } } : {},
    );

    return (
        <form action={action} noValidate className="flex flex-col gap-5">
            <input type="hidden" name="next" value={next} />
            <FormField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state.values?.email ?? ""}
                error={state.errors?.email}
            />
            <FormField
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                error={state.errors?.password}
            />
            {state.errors?.form && (
                <p role="alert" className="text-sm text-reading-danger">
                    {state.errors.form}
                </p>
            )}
            <Button type="submit" size="lg" loading={pending}>
                Log in
            </Button>
            <div className="flex flex-col gap-1 text-sm text-reading-text-muted">
                <p>
                    New here?{" "}
                    <Link
                        href={`/signup?next=${encodeURIComponent(next)}`}
                        className="text-reading-link"
                    >
                        Create an account
                    </Link>
                </p>
                <p>
                    <Link href="/forgot-password" className="text-reading-link">
                        Forgot your password?
                    </Link>
                </p>
            </div>
        </form>
    );
}
