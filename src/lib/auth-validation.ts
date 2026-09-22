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

/** Only allow same-origin relative paths as post-auth redirect targets. */
export function safeReturnPath(value: unknown, fallback = "/reader"): string {
    if (typeof value !== "string") return fallback;
    if (!value.startsWith("/") || value.startsWith("//")) return fallback;
    if (value.includes("\\") || /[\r\n]/.test(value)) return fallback;
    return value;
}
