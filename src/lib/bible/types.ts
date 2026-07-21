export type Testament = "old" | "new";

export interface Translation {
    id: number;
    slug: string;
    abbreviation: string;
    name: string;
    languageCode: string;
    versification: string;
    isPublicDomain: boolean;
    isEnabled: boolean;
}

export interface Book {
    id: number;
    osisId: string;
    slug: string;
    name: string;
    abbreviation: string | null;
    testament: Testament;
    order: number;
    chapterCount: number;
}

export interface Chapter {
    id: number;
    bookId: number;
    chapterNumber: number;
    verseCount: number;
}

export interface Verse {
    id: number;
    translationId: number;
    bookId: number;
    chapterNumber: number;
    verseNumber: number;
    text: string;
}

export interface VerseRange {
    bookSlug: string;
    chapterNumber: number;
    startVerse: number;
    endVerse?: number;
}

export interface BookWithChapters extends Book {
    chapters: Chapter[];
}

export interface BibleChapter {
    translation: Translation;
    book: BookWithChapters;
    chapter: Chapter;
    verses: Verse[];
    previous: ChapterReference | null;
    next: ChapterReference | null;
}

export interface ChapterReference {
    bookSlug: string;
    bookName: string;
    chapterNumber: number;
}

export interface SearchResult {
    bookSlug: string;
    bookName: string;
    bookOrder: number;
    chapterNumber: number;
    verseNumber: number;
    translationSlug: string;
    translationAbbreviation: string;
    text: string;
    rank: number;
}
