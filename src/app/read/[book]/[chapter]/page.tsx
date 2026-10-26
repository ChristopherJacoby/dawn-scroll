import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { ChapterPrefetch } from "@/components/reader/ChapterPrefetch";
import { ChapterVerses } from "@/components/reader/ChapterVerses";
import { ReaderSelectors } from "@/components/reader/ReaderSelectors";
import { ReadingModeToggle } from "@/components/reader/ReadingModeToggle";
import { VerseAnchorScroll } from "@/components/reader/VerseAnchorScroll";
import { buttonVariants } from "@/components/ui/Button";
import { isAiConfigured } from "@/lib/ai/config";
import { getChapterFindings } from "@/lib/archaeology/queries";
import { getUser } from "@/lib/auth";
import {
    getBibleBooks,
    getChapter,
    getEnabledTranslations,
} from "@/lib/bible/queries";
import { getPreferredTranslation } from "@/lib/bible/translation-preference";
import { getChapterBookmarkIds } from "@/lib/bookmarks";
import { getChapterHighlights } from "@/lib/highlights";
import { getChapterNotes } from "@/lib/notes";
import { cn } from "@/lib/cn";

interface ReaderPageProps {
    params: Promise<{
        book: string;
        chapter: string;
    }>;
}

function parseChapter(value: string) {
    return /^\d+$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({
    params,
}: ReaderPageProps): Promise<Metadata> {
    const { book, chapter } = await params;
    const chapterNumber = parseChapter(chapter);
    if (!chapterNumber) return { title: "Passage unavailable | Dawnscroll" };

    const translation = await getPreferredTranslation();
    const passage =
        translation && (await getChapter(book, chapterNumber, translation));
    if (!passage) return { title: "Passage unavailable | Dawnscroll" };

    return {
        title: `${passage.book.name} ${passage.chapter.chapterNumber} ${passage.translation.abbreviation} | Dawnscroll`,
        description: `Read ${passage.book.name} ${passage.chapter.chapterNumber} in the ${passage.translation.name}.`,
    };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
    const { book, chapter } = await params;
    const chapterNumber = parseChapter(chapter);
    if (!chapterNumber) notFound();

    const translation = await getPreferredTranslation();
    if (!translation) notFound();

    const [books, translations, passage, user, findings] = await Promise.all([
        getBibleBooks(),
        getEnabledTranslations(),
        getChapter(book, chapterNumber, translation),
        getUser(),
        // Findings are extra; the chapter still renders without them.
        getChapterFindings(book, chapterNumber).catch(() => []),
    ]);
    if (!passage || passage.verses.length === 0) notFound();

    const { id: bookId } = passage.book;
    const { chapterNumber: chapterNum } = passage.chapter;
    const [bookmarks, highlights, notes] = user
        ? await Promise.all([
              getChapterBookmarkIds(bookId, chapterNum),
              getChapterHighlights(bookId, chapterNum),
              getChapterNotes(bookId, chapterNum),
          ])
        : [{}, {}, {}];

    const reference = `${passage.book.name} ${passage.chapter.chapterNumber}`;
    const aiEnabled = isAiConfigured();

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <header className="border-b border-reading-divider bg-reading-surface">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 md:px-10 md:py-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                {passage.translation.name}
                            </p>
                            <h1 className="font-serif text-4xl leading-tight text-reading-text md:text-5xl">
                                {reference}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {aiEnabled && (
                                <Link
                                    href={`/scholar?book=${passage.book.slug}&chapter=${passage.chapter.chapterNumber}`}
                                    className={buttonVariants({
                                        variant: "secondary",
                                        size: "sm",
                                    })}
                                >
                                    <ScrollText
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only whitespace-nowrap lg:not-sr-only">
                                        Ask about this passage
                                    </span>
                                </Link>
                            )}
                            <ReadingModeToggle />
                        </div>
                    </div>
                    <ReaderSelectors
                        books={books}
                        currentBookSlug={passage.book.slug}
                        currentChapter={passage.chapter.chapterNumber}
                        translations={translations.map((t) => ({
                            slug: t.slug,
                            abbreviation: t.abbreviation,
                            name: t.name,
                        }))}
                        currentTranslation={passage.translation.slug}
                    />
                </div>
            </header>

            <article
                aria-labelledby="reader-heading"
                className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10 md:py-12"
            >
                <h2 id="reader-heading" className="sr-only">
                    {reference} {passage.translation.name}
                </h2>
                <VerseAnchorScroll
                    key={`${passage.book.slug}-${passage.chapter.chapterNumber}`}
                />
                <ChapterPrefetch
                    // Switching translation evicts the prefetched chapters;
                    // remounting fetches them again in the new one.
                    key={passage.translation.slug}
                    previousHref={
                        passage.previous
                            ? `/read/${passage.previous.bookSlug}/${passage.previous.chapterNumber}`
                            : null
                    }
                    nextHref={
                        passage.next
                            ? `/read/${passage.next.bookSlug}/${passage.next.chapterNumber}`
                            : null
                    }
                />
                <ChapterVerses
                    key={`verses-${passage.book.slug}-${passage.chapter.chapterNumber}-${passage.translation.slug}`}
                    bookSlug={passage.book.slug}
                    bookName={passage.book.name}
                    chapterNumber={passage.chapter.chapterNumber}
                    translation={{
                        slug: passage.translation.slug,
                        abbreviation: passage.translation.abbreviation,
                    }}
                    verses={passage.verses.map((verse) => ({
                        number: verse.verseNumber,
                        text: verse.text,
                    }))}
                    signedIn={user !== null}
                    bookmarks={bookmarks}
                    highlights={highlights}
                    notes={notes}
                    findings={findings}
                    aiEnabled={aiEnabled}
                />
            </article>

            <nav
                aria-label="Adjacent chapters"
                className="border-t border-reading-divider bg-reading-surface"
            >
                <div className="mx-auto grid w-full max-w-5xl gap-3 px-5 py-5 md:grid-cols-2 md:px-10">
                    <ChapterNavLink
                        direction="previous"
                        item={passage.previous}
                    />
                    <ChapterNavLink direction="next" item={passage.next} />
                </div>
            </nav>
        </div>
    );
}

function ChapterNavLink({
    direction,
    item,
}: {
    direction: "previous" | "next";
    item: { bookSlug: string; bookName: string; chapterNumber: number } | null;
}) {
    const isPrevious = direction === "previous";

    if (!item) {
        return (
            <span
                className={cn(
                    "flex min-h-16 items-center rounded-md border border-reading-border px-4 text-sm text-reading-text-muted opacity-60",
                    isPrevious ? "justify-start" : "justify-end text-right",
                )}
            >
                {isPrevious ? "Beginning" : "End"}
            </span>
        );
    }

    return (
        <Link
            href={`/read/${item.bookSlug}/${item.chapterNumber}`}
            prefetch={true}
            className={cn(
                "flex min-h-16 items-center gap-3 rounded-md border border-reading-border px-4 text-sm text-reading-text transition-colors hover:bg-reading-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg",
                isPrevious ? "justify-start" : "justify-end text-right",
            )}
        >
            {isPrevious && <ChevronLeft className="h-4 w-4 shrink-0" />}
            <span>
                <span className="block text-xs text-reading-text-muted">
                    {isPrevious ? "Previous" : "Next"}
                </span>
                <span className="font-medium">
                    {item.bookName} {item.chapterNumber}
                </span>
            </span>
            {!isPrevious && <ChevronRight className="h-4 w-4 shrink-0" />}
        </Link>
    );
}
