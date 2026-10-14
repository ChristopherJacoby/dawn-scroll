/**
 * Verse tokenization and normalization shared by the original-language
 * import (scripts/import-original-language.mjs) and the reader, so token
 * indexes stored by the import match what the reader renders.
 */

/** Display tokens of a verse: whitespace-separated runs, punctuation kept. */
export function tokenizeVerse(text: string): string[] {
    return text.split(/\s+/).filter(Boolean);
}

/** Letters only, lowercased, accents removed: for aligning editions. */
export function normalizeToken(token: string): string {
    return token
        .normalize("NFKD")
        .replace(/[^\p{L}]/gu, "")
        .toLowerCase();
}

/**
 * Canonical Strong's number: language letter plus four digits, without
 * STEPBible's disambiguation suffix ("g746" → "G0746", "H3068G" → "H3068").
 * Null for anything that isn't a Strong's number.
 */
export function normalizeStrongs(value: string): string | null {
    const match = /^([GH])0*(\d{1,4})[A-Za-z]?$/i.exec(value.trim());
    if (!match) return null;
    return `${match[1].toUpperCase()}${match[2].padStart(4, "0")}`;
}

/** Strong's number for display: "G0746" → "G746". */
export function displayStrongs(number: string): string {
    return number.replace(/^([GH])0+/, "$1");
}
