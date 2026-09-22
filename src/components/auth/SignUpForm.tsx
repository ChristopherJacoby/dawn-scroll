"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignUpState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth-validation";

export function SignUpForm({ next }: { next: string }) {
    const [state, action, pending] = useActionState<SignUpState, FormData>(
        signUp,
        {},
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
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
                error={state.errors?.password}
            />
            <FormField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                error={state.errors?.confirmPassword}
            />
            {state.errors?.form && (
                <p role="alert" className="text-sm text-reading-danger">
                    {state.errors.form}
                </p>
            )}
            <Button type="submit" size="lg" loading={pending}>
                Create account
            </Button>
            <p className="text-sm text-reading-text-muted">
                Already have an account?{" "}
                <Link
                    href={`/login?next=${encodeURIComponent(next)}`}
                    className="text-reading-link"
                >
                    Log in
                </Link>
            </p>
        </form>
    );
}
