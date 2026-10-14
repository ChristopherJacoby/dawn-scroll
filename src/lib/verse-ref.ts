/**
 * Verse references as clients send them (slugs + numbers, as in reader
 * URLs), shared by bookmarks, highlights and notes.
 */
export interface VerseRefInput {
    book: string;
    chapter: number;
    verse: number;
    translation: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function positiveSmallInt(value: unknown): number | null {
    return typeof value === "number" &&
        Number.isInteger(value) &&
        value > 0 &&
        value < 32768
        ? value
        : null;
}

/**
 * Validate an untrusted `{ book, chapter, verse, translation? }` payload
 * (translation defaults to KJV). Returns null when any part is malformed;
 * whether the verse exists is checked against the database separately.
 */
export function parseVerseRef(value: unknown): VerseRefInput | null {
    if (!value || typeof value !== "object") return null;
    const input = value as Record<string, unknown>;
    const translation = input.translation ?? "kjv";
    const chapter = positiveSmallInt(input.chapter);
    const verse = positiveSmallInt(input.verse);
    if (typeof input.book !== "string" || !SLUG.test(input.book)) return null;
    if (typeof translation !== "string" || !SLUG.test(translation)) return null;
    if (!chapter || !verse) return null;
    return { book: input.book, chapter, verse, translation };
}

export function isUuid(value: string): boolean {
    return UUID.test(value);
}

export interface CanonicalPosition {
    bookOrder: number;
    chapterNumber: number;
    verseNumber: number;
}

/** Sort comparator for Bible order: book, then chapter, then verse. */
export function compareCanonical(
    a: CanonicalPosition,
    b: CanonicalPosition,
): number {
    return (
        a.bookOrder - b.bookOrder ||
        a.chapterNumber - b.chapterNumber ||
        a.verseNumber - b.verseNumber
    );
}

/** Reader URL for a verse, landing on (and flashing) the verse itself. */
export function verseHref(
    bookSlug: string,
    chapterNumber: number,
    verseNumber: number,
): string {
    return `/read/${bookSlug}/${chapterNumber}#verse-${verseNumber}`;
}
