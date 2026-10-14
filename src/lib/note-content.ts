/** Longest note, in UTF-16 code units of the raw text (the database caps
 * char_length, which counts code points, so this is the stricter bound). */
export const NOTE_MAX_LENGTH = 5000;

/**
 * Validate untrusted note text. Returns the text as typed (surrounding
 * whitespace kept), "" for a blank note, or null when it isn't a string or
 * is too long.
 */
export function parseNoteContent(value: unknown): string | null {
    if (typeof value !== "string" || value.length > NOTE_MAX_LENGTH) {
        return null;
    }
    return value.trim() ? value : "";
}
