export const PASSWORD_MIN_LENGTH = 8;
export const DISPLAY_NAME_MAX_LENGTH = 60;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
    const email = value.trim();
    if (!email) return "Enter your email address.";
    if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
    return undefined;
}

export function validatePassword(value: string): string | undefined {
    if (!value) return "Enter a password.";
    if (value.length < PASSWORD_MIN_LENGTH)
        return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    return undefined;
}

export function validateSignUp(input: {
    email: string;
    password: string;
    confirmPassword: string;
}): FieldErrors<"email" | "password" | "confirmPassword"> {
    const errors: FieldErrors<"email" | "password" | "confirmPassword"> = {};
    const email = validateEmail(input.email);
    if (email) errors.email = email;
    const password = validatePassword(input.password);
    if (password) errors.password = password;
    else if (input.password !== input.confirmPassword)
        errors.confirmPassword = "Passwords don't match.";
    return errors;
}

export function validateLogIn(input: {
    email: string;
    password: string;
}): FieldErrors<"email" | "password"> {
    const errors: FieldErrors<"email" | "password"> = {};
    const email = validateEmail(input.email);
    if (email) errors.email = email;
    if (!input.password) errors.password = "Enter your password.";
    return errors;
}

const PLACEHOLDER_ORIGIN = "http://same-origin.invalid";

/**
 * Only allow same-origin relative paths as post-auth redirect targets.
 * Browsers strip tabs and newlines from URLs (so "/\t/evil" becomes
 * "//evil") and treat "\\" as "/", so any control character or backslash
 * is rejected outright; resolving against a placeholder origin then catches
 * every other way of spelling another host.
 */
export function safeReturnPath(value: unknown, fallback = "/reader"): string {
    if (typeof value !== "string" || !value.startsWith("/")) return fallback;
    if (/[\x00-\x1f\x7f\\]/.test(value)) return fallback;
    let url: URL;
    try {
        url = new URL(value, PLACEHOLDER_ORIGIN);
    } catch {
        return fallback;
    }
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return url.pathname + url.search + url.hash;
}
