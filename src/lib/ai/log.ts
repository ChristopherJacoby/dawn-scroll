/** Server log (Vercel function logs) for failures users only see generically. */
export function logAiError(message: string, error: unknown) {
    // eslint-disable-next-line no-console -- server-side diagnostics
    console.error(message, error);
}
