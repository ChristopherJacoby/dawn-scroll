"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { forgotPassword, type ForgotPasswordState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

export function ForgotPasswordForm() {
    const [state, action, pending] = useActionState<
        ForgotPasswordState,
        FormData
    >(forgotPassword, {});

    if (state.sent) {
        return (
            <div className="flex flex-col gap-4 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5">
                <MailCheck
                    className="h-8 w-8 text-reading-citation"
                    aria-hidden="true"
                />
                <p className="text-base text-reading-text">
                    If an account exists for{" "}
                    <strong className="font-medium">
                        {state.values?.email}
                    </strong>
                    , we sent a link to reset your password.
                </p>
                <p className="text-sm text-reading-text-muted">
                    Didn&apos;t get it? Check your spam folder, or{" "}
                    <Link href="/login" className="text-reading-link">
                        return to log in
                    </Link>
                    .
                </p>
            </div>
        );
    }

    return (
        <form action={action} noValidate className="flex flex-col gap-5">
            <p className="text-sm text-reading-text-muted">
                Enter your email and we&apos;ll send you a link to choose a new
                password.
            </p>
            <FormField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state.values?.email ?? ""}
                error={state.errors?.email}
            />
            {state.errors?.form && (
                <p role="alert" className="text-sm text-reading-danger">
                    {state.errors.form}
                </p>
            )}
            <Button type="submit" size="lg" loading={pending}>
                Send reset link
            </Button>
            <p className="text-sm text-reading-text-muted">
                <Link href="/login" className="text-reading-link">
                    Back to log in
                </Link>
            </p>
        </form>
    );
}
