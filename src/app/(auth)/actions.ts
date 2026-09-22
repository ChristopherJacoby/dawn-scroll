"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReadingMode } from "@/context/reading-mode";
import { updateOwnDisplayName } from "@/lib/profiles";
import {
    FONT_SCALE_MAX,
    FONT_SCALE_MIN,
    saveUserSettings,
} from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import {
    DISPLAY_NAME_MAX_LENGTH,
    safeReturnPath,
    validateEmail,
    validateLogIn,
    validatePassword,
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

export interface ForgotPasswordState {
    errors?: FieldErrors<"email" | "form">;
    values?: { email: string };
    sent?: boolean;
}

export async function forgotPassword(
    _prev: ForgotPasswordState,
    formData: FormData,
): Promise<ForgotPasswordState> {
    const email = String(formData.get("email") ?? "").trim();
    const emailError = validateEmail(email);
    if (emailError) return { errors: { email: emailError }, values: { email } };

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${await siteOrigin()}/auth/confirm`,
    });

    // Rate limits are the only error worth distinguishing; anything else
    // (including unknown addresses) reads as "sent" to avoid enumeration.
    if (error && /rate limit|too many/i.test(error.message)) {
        return {
            errors: {
                form: "Too many attempts. Please wait a minute and try again.",
            },
            values: { email },
        };
    }

    return { sent: true, values: { email } };
}

export interface ResetPasswordState {
    errors?: FieldErrors<"password" | "confirmPassword" | "form">;
}

export async function resetPassword(
    _prev: ResetPasswordState,
    formData: FormData,
): Promise<ResetPasswordState> {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const passwordError = validatePassword(password);
    if (passwordError) return { errors: { password: passwordError } };
    if (password !== confirmPassword)
        return { errors: { confirmPassword: "Passwords don't match." } };

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return {
            errors: {
                form: "Your reset link has expired. Please request a new one.",
            },
        };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        return {
            errors: {
                form: /same|different/i.test(error.message)
                    ? "Choose a password you haven't used before."
                    : error.message,
            },
        };
    }

    redirect("/account?reset=1");
}

export interface DisplayNameState {
    error?: string;
    saved?: boolean;
}

export async function updateDisplayName(
    _prev: DisplayNameState,
    formData: FormData,
): Promise<DisplayNameState> {
    const {
        data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) redirect("/login?next=%2Faccount");

    const raw = String(formData.get("displayName") ?? "").trim();
    if (raw.length > DISPLAY_NAME_MAX_LENGTH) {
        return {
            error: `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
        };
    }

    try {
        await updateOwnDisplayName(user.id, raw || null);
    } catch {
        return { error: "We couldn't save your name. Please try again." };
    }
    revalidatePath("/account");
    return { saved: true };
}

export interface SettingsState {
    error?: string;
    saved?: boolean;
}

export async function saveSettings(
    _prev: SettingsState,
    formData: FormData,
): Promise<SettingsState> {
    const {
        data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) redirect("/login?next=%2Fsettings");

    const readingMode = String(formData.get("readingMode") ?? "");
    const fontScale = Number(formData.get("fontScale"));
    if (!isReadingMode(readingMode)) return { error: "Choose a reading mode." };
    if (
        !Number.isInteger(fontScale) ||
        fontScale < FONT_SCALE_MIN ||
        fontScale > FONT_SCALE_MAX
    ) {
        return { error: "Choose a text size between 80% and 140%." };
    }

    try {
        await saveUserSettings(user.id, { readingMode, fontScale });
    } catch {
        return { error: "We couldn't save your settings. Please try again." };
    }
    revalidatePath("/", "layout");
    return { saved: true };
}

function isReadingMode(value: string): value is ReadingMode {
    return value === "light" || value === "sepia" || value === "dark";
}

/** Fire-and-forget save from the reader toolbar; no-op when signed out. */
export async function persistReadingMode(mode: ReadingMode) {
    if (!isReadingMode(mode)) return;
    const {
        data: { user },
    } = await (await createClient()).auth.getUser();
    if (!user) return;
    try {
        await saveUserSettings(user.id, { readingMode: mode });
    } catch {
        // Local state already applied; a failed sync just doesn't persist.
    }
}
