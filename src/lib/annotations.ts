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
    translations: { abbreviation: string };
    verses: { verse_text: string };
}

export function mapAnnotatedVerse(row: VerseEmbedRow): AnnotatedVerse {
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
