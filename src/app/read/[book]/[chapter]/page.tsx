import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReaderSelectors } from "@/components/reader/ReaderSelectors";
import { getBibleBooks, getKjvChapter } from "@/lib/bible/queries";
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

    const passage = await getKjvChapter(book, chapterNumber);
    if (!passage) return { title: "Passage unavailable | Dawnscroll" };

    return {
        title: `${passage.book.name} ${passage.chapter.chapterNumber} KJV | Dawnscroll`,
        description: `Read ${passage.book.name} ${passage.chapter.chapterNumber} in the King James Version.`,
    };
}

export default async function ReaderPage({ params }: ReaderPageProps) {
    const { book, chapter } = await params;
    const chapterNumber = parseChapter(chapter);
    if (!chapterNumber) notFound();

    const [books, passage] = await Promise.all([
        getBibleBooks(),
        getKjvChapter(book, chapterNumber),
    ]);
    if (!passage || passage.verses.length === 0) notFound();

    const reference = `${passage.book.name} ${passage.chapter.chapterNumber}`;

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <header className="border-b border-reading-divider bg-reading-surface">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 md:px-10 md:py-8">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                            {passage.translation.abbreviation}
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-reading-text md:text-5xl">
                            {reference}
                        </h1>
                    </div>
                    <ReaderSelectors
                        books={books}
                        currentBookSlug={passage.book.slug}
                        currentChapter={passage.chapter.chapterNumber}
                    />
                </div>
            </header>

            <article
                aria-labelledby="reader-heading"
                className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10 md:py-12"
            >
                <h2 id="reader-heading" className="sr-only">
                    {reference} King James Version
                </h2>
                <div className="selection-reading flex flex-col gap-4 font-serif text-[1.35rem] leading-9 text-reading-text md:text-[1.5rem] md:leading-10">
                    {passage.verses.map((verse) => (
                        <p
                            key={verse.id}
                            id={`verse-${verse.verseNumber}`}
                            className="scroll-mt-24"
                        >
                            <sup className="mr-2 align-super font-sans text-xs font-semibold text-reading-text-muted">
                                {verse.verseNumber}
                            </sup>
                            {verse.text}
                        </p>
                    ))}
                </div>
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
