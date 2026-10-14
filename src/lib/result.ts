/**
 * Outcome of a user-data mutation, shared by Server Actions (returned to
 * the client as-is) and API routes (mapped to an HTTP response). `status`
 * is the HTTP status the outcome corresponds to.
 */
export type Result<T> =
    | { ok: true; status: number; value: T }
    | { ok: false; status: number; error: string };

export function ok<T>(value: T, status = 200): Result<T> {
    return { ok: true, status, value };
}

export function fail(status: number, error: string): Result<never> {
    return { ok: false, status, error };
}
