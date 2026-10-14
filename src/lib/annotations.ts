/**
 * The verse side of every annotation (bookmark, highlight, note): the
 * PostgREST embed that pulls in the book, translation and verse text, and
 * its mapping. Each annotation table has the same verse columns and
 * foreign keys, so one select fragment serves them all.
 */
export const VERSE_EMBED =
    "chapter_number, verse_number, books!inner(slug, name, book_order), translations(abbreviation), verses(verse_text)";

export interface AnnotatedVerse {
    bookSlug: string;
    bookName: string;
    bookOrder: number;
    chapterNumber: number;
    verseNumber: number;
    translation: string;
    text: string;
}

export interface VerseEmbedRow {
    chapter_number: number;
    verse_number: number;
    books: { slug: string; name: string; book_order: number };
    // RLS hides disabled translations (and their verses), so an annotation
    // made in a since-disabled translation embeds null here.
    translations: { abbreviation: string } | null;
    verses: { verse_text: string } | null;
}

/** The verse an annotation points at, or null when it's no longer readable. */
export function mapAnnotatedVerse(row: VerseEmbedRow): AnnotatedVerse | null {
    if (!row.translations || !row.verses) return null;
    return {
        bookSlug: row.books.slug,
        bookName: row.books.name,
        bookOrder: row.books.book_order,
        chapterNumber: row.chapter_number,
        verseNumber: row.verse_number,
        translation: row.translations.abbreviation,
        text: row.verses.verse_text,
    };
}

export function verseReference(verse: AnnotatedVerse): string {
    return `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
}

type QueryResult = PromiseLike<{
    data: unknown;
    error: { code?: string } | null;
}>;

/**
 * Insert a per-verse annotation row, or, when the user already has one for
 * that verse (unique violation), fall back to `existing` (a select or an
 * update ending in `.maybeSingle()`). If the existing row vanishes in
 * between (deleted in another tab), the insert is retried once.
 */
export async function insertOrExisting<Row>(
    insert: () => QueryResult,
    existing: () => QueryResult,
): Promise<{ row: Row; created: boolean }> {
    for (let attempt = 0; attempt < 2; attempt++) {
        const inserted = await insert();
        if (!inserted.error)
            return { row: inserted.data as Row, created: true };
        if (inserted.error.code !== "23505") throw inserted.error;
        const found = await existing();
        if (found.error) throw found.error;
        if (found.data) return { row: found.data as Row, created: false };
    }
    throw new Error("The annotation changed while saving.");
}

/** Mapped annotation, or an error when its translation is no longer readable. */
export function readable<T>(value: T | null): T {
    if (value === null)
        throw new Error("Annotation's translation is disabled.");
    return value;
}
