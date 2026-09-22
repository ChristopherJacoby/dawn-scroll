"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth-validation";

export function ResetPasswordForm() {
    const [state, action, pending] = useActionState<
        ResetPasswordState,
        FormData
    >(resetPassword, {});

    return (
        <form action={action} noValidate className="flex flex-col gap-5">
            <FormField
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
                error={state.errors?.password}
            />
            <FormField
                label="Confirm new password"
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
                Save new password
            </Button>
        </form>
    );
}
