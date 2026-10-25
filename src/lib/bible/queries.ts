import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { VerseRefInput } from "@/lib/verse-ref";
import type {
    BibleChapter,
    Book,
    BookWithChapters,
    Chapter,
    ChapterReference,
    SearchResult,
    Testament,
    Translation,
    Verse,
} from "./types";

export const DEFAULT_TRANSLATION = "kjv";

interface BookRow {
    id: number;
    osis_id: string;
    slug: string;
    name: string;
    common_abbreviation: string | null;
    testament: Testament;
    book_order: number;
    chapters_count: number;
}

interface ChapterRow {
    id: number;
    book_id: number;
    chapter_number: number;
    verse_count: number;
}

interface TranslationRow {
    id: number;
    slug: string;
    abbreviation: string;
    name: string;
    language_code: string;
    versification: string;
    is_public_domain: boolean;
    is_enabled: boolean;
}

interface VerseRow {
    id: number;
    translation_id: number;
    book_id: number;
    chapter_number: number;
    verse_number: number;
    verse_text: string;
}

interface SearchRow {
    book_slug: string;
    book_name: string;
    book_order: number;
    chapter_number: number;
    verse_number: number;
    translation_slug: string;
    translation_abbreviation: string;
    verse_text: string;
    rank: number;
}

function mapBook(row: BookRow): Book {
    return {
        id: row.id,
        osisId: row.osis_id,
        slug: row.slug,
        name: row.name,
        abbreviation: row.common_abbreviation,
        testament: row.testament,
        order: row.book_order,
        chapterCount: row.chapters_count,
    };
}

function mapChapter(row: ChapterRow): Chapter {
    return {
        id: row.id,
        bookId: row.book_id,
        chapterNumber: row.chapter_number,
        verseCount: row.verse_count,
    };
}

function mapTranslation(row: TranslationRow): Translation {
    return {
        id: row.id,
        slug: row.slug,
        abbreviation: row.abbreviation,
        name: row.name,
        languageCode: row.language_code,
        versification: row.versification,
        isPublicDomain: row.is_public_domain,
        isEnabled: row.is_enabled,
    };
}

function mapVerse(row: VerseRow): Verse {
    return {
        id: row.id,
        translationId: row.translation_id,
        bookId: row.book_id,
        chapterNumber: row.chapter_number,
        verseNumber: row.verse_number,
        text: row.verse_text,
    };
}

function mapSearchResult(row: SearchRow): SearchResult {
    return {
        bookSlug: row.book_slug,
        bookName: row.book_name,
        bookOrder: row.book_order,
        chapterNumber: row.chapter_number,
        verseNumber: row.verse_number,
        translationSlug: row.translation_slug,
        translationAbbreviation: row.translation_abbreviation,
        text: row.verse_text,
        rank: row.rank,
    };
}

function byBookOrder(a: BookWithChapters, b: BookWithChapters) {
    return a.order - b.order;
}

function toChapterReference(
    book: BookWithChapters,
    chapterNumber: number,
): ChapterReference {
    return {
        bookSlug: book.slug,
        bookName: book.name,
        chapterNumber,
    };
}

// PostgREST caps every response at the project's max-rows (1,000); the
// KJV has 1,189 chapters, so a single select silently drops the rest.
const CHAPTER_PAGE_SIZE = 1000;

async function getAllChapterRows(): Promise<ChapterRow[]> {
    const supabase = await createClient();
    const rows: ChapterRow[] = [];
    for (let from = 0; ; from += CHAPTER_PAGE_SIZE) {
        // (book_id, chapter_number) is unique, so pages never overlap.
        const { data, error } = await supabase
            .from("chapters")
            .select("id, book_id, chapter_number, verse_count")
            .order("book_id", { ascending: true })
            .order("chapter_number", { ascending: true })
            .range(from, from + CHAPTER_PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...((data ?? []) as ChapterRow[]));
        if ((data ?? []).length < CHAPTER_PAGE_SIZE) return rows;
    }
}

export async function getBibleBooks(): Promise<BookWithChapters[]> {
    const supabase = await createClient();
    const [booksResult, chapterRows] = await Promise.all([
        supabase
            .from("books")
            .select(
                "id, osis_id, slug, name, common_abbreviation, testament, book_order, chapters_count",
            )
            .order("book_order", { ascending: true }),
        getAllChapterRows(),
    ]);

    if (booksResult.error) throw booksResult.error;

    const chaptersByBook = new Map<number, Chapter[]>();
    for (const row of chapterRows) {
        const chapter = mapChapter(row);
        const existing = chaptersByBook.get(chapter.bookId) ?? [];
        existing.push(chapter);
        chaptersByBook.set(chapter.bookId, existing);
    }

    return ((booksResult.data ?? []) as BookRow[]).map((row) => {
        const book = mapBook(row);
        return {
            ...book,
            chapters: chaptersByBook.get(book.id) ?? [],
        };
    });
}

const TRANSLATION_COLUMNS =
    "id, slug, abbreviation, name, language_code, versification, is_public_domain, is_enabled";

/**
 * Translations readers can pick, KJV (the default) first. RLS hides
 * disabled ones. Memoized per server render.
 */
export const getEnabledTranslations = cache(
    async (): Promise<Translation[]> => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("translations")
            .select(TRANSLATION_COLUMNS)
            .eq("is_enabled", true)
            .order("abbreviation", { ascending: true });
        if (error) throw error;
        return ((data ?? []) as TranslationRow[])
            .map(mapTranslation)
            .sort(
                (a, b) =>
                    Number(b.slug === DEFAULT_TRANSLATION) -
                    Number(a.slug === DEFAULT_TRANSLATION),
            );
    },
);

/** A chapter's verses in `translation`, or null when it doesn't exist. */
export async function getChapter(
    bookSlug: string,
    chapterNumber: number,
    translation: Translation,
): Promise<BibleChapter | null> {
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) return null;

    const books = await getBibleBooks();
    const sortedBooks = [...books].sort(byBookOrder);
    const bookIndex = sortedBooks.findIndex((item) => item.slug === bookSlug);
    if (bookIndex === -1) return null;

    const book = sortedBooks[bookIndex];
    const chapter = book.chapters.find(
        (item) => item.chapterNumber === chapterNumber,
    );
    if (!chapter) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("verses")
        .select(
            "id, translation_id, book_id, chapter_number, verse_number, verse_text",
        )
        .eq("translation_id", translation.id)
        .eq("book_id", book.id)
        .eq("chapter_number", chapterNumber)
        .order("verse_number", { ascending: true });

    if (error) throw error;

    const previous =
        chapterNumber > 1
            ? toChapterReference(book, chapterNumber - 1)
            : bookIndex > 0
              ? toChapterReference(
                    sortedBooks[bookIndex - 1],
                    sortedBooks[bookIndex - 1].chapterCount,
                )
              : null;
    const next =
        chapterNumber < book.chapterCount
            ? toChapterReference(book, chapterNumber + 1)
            : bookIndex < sortedBooks.length - 1
              ? toChapterReference(sortedBooks[bookIndex + 1], 1)
              : null;

    return {
        translation,
        book,
        chapter,
        verses: ((data ?? []) as VerseRow[]).map(mapVerse),
        previous,
        next,
    };
}

export async function searchKjv(
    query: string,
    limit = 20,
): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_kjv_verses", {
        search_query: trimmed,
        result_limit: limit,
    });

    if (error) throw error;
    return ((data ?? []) as SearchRow[]).map(mapSearchResult);
}

/** A verse as the database keys it (what annotation tables reference). */
export interface ResolvedVerseRef {
    translationId: number;
    bookId: number;
    chapterNumber: number;
    verseNumber: number;
}

/** Look up a verse's database keys; null when no such verse exists. */
export async function resolveVerseRef(
    ref: VerseRefInput,
): Promise<ResolvedVerseRef | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("verses")
        .select(
            "translation_id, book_id, chapter_number, verse_number, books!inner(slug), translations!inner(slug)",
        )
        .eq("books.slug", ref.book)
        .eq("translations.slug", ref.translation)
        .eq("chapter_number", ref.chapter)
        .eq("verse_number", ref.verse)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const row = data as Pick<
        VerseRow,
        "translation_id" | "book_id" | "chapter_number" | "verse_number"
    >;
    return {
        translationId: row.translation_id,
        bookId: row.book_id,
        chapterNumber: row.chapter_number,
        verseNumber: row.verse_number,
    };
}
