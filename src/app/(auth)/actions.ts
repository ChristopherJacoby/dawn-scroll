"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
    safeReturnPath,
    validateLogIn,
    validateSignUp,
    type FieldErrors,
} from "@/lib/auth-validation";

export interface SignUpState {
    errors?: FieldErrors<"email" | "password" | "confirmPassword" | "form">;
    values?: { email: string };
}

async function siteOrigin() {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
}

export async function signUp(
    _prev: SignUpState,
    formData: FormData,
): Promise<SignUpState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const next = safeReturnPath(formData.get("next"));

    const errors = validateSignUp({ email, password, confirmPassword });
    if (Object.keys(errors).length > 0) {
        return { errors, values: { email } };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
    });

    if (error) {
        if (error.code === "email_address_invalid") {
            return {
                errors: { email: "Enter a valid email address." },
                values: { email },
            };
        }
        return {
            errors: { form: friendlySignUpError(error.message) },
            values: { email },
        };
    }

    // Supabase returns a user with an empty identities array (and no
    // session) when the address is already registered and confirmations
    // are on — say so instead of silently "sending" nothing.
    if (data.user && data.user.identities?.length === 0) {
        return {
            errors: {
                email: "An account with this email already exists. Try logging in.",
            },
            values: { email },
        };
    }

    // Confirmations off (dev) → session exists → straight in.
    if (data.session) redirect(next);

    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}

function friendlySignUpError(message: string) {
    if (/password/i.test(message)) return message;
    if (/rate limit|too many/i.test(message))
        return "Too many attempts. Please wait a minute and try again.";
    return "We couldn't create your account. Please try again.";
}

export interface LogInState {
    errors?: FieldErrors<"email" | "password" | "form">;
    values?: { email: string };
}

export async function logIn(
    _prev: LogInState,
    formData: FormData,
): Promise<LogInState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const next = safeReturnPath(formData.get("next"));

    const errors = validateLogIn({ email, password });
    if (Object.keys(errors).length > 0) {
        return { errors, values: { email } };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            errors: { form: friendlyLogInError(error.code) },
            values: { email },
        };
    }

    redirect(next);
}

function friendlyLogInError(code: string | undefined) {
    switch (code) {
        case "email_not_confirmed":
            return "Confirm your email first — check your inbox for the link.";
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
            return "Too many attempts. Please wait a minute and try again.";
        default:
            return "Incorrect email or password.";
    }
}

export async function logOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/reader");
}
