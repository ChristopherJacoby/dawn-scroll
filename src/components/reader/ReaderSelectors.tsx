"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import type { BookWithChapters } from "@/lib/bible/types";
import { cn } from "@/lib/cn";

interface ReaderSelectorsProps {
    books: BookWithChapters[];
    currentBookSlug: string;
    currentChapter: number;
}

export function ReaderSelectors({
    books,
    currentBookSlug,
    currentChapter,
}: ReaderSelectorsProps) {
    const router = useRouter();
    const currentBook = books.find((book) => book.slug === currentBookSlug);

    function navigate(bookSlug: string, chapter: number) {
        router.push(`/read/${bookSlug}/${chapter}`);
    }

    function onBookChange(event: ChangeEvent<HTMLSelectElement>) {
        navigate(event.target.value, 1);
    }

    function onChapterChange(event: ChangeEvent<HTMLSelectElement>) {
        navigate(currentBookSlug, Number(event.target.value));
    }

    return (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
            <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-reading-text-muted">
                    Book
                </span>
                <select
                    value={currentBookSlug}
                    onChange={onBookChange}
                    className={selectClassName}
                    aria-label="Select book"
                >
                    <optgroup label="Old Testament">
                        {books
                            .filter((book) => book.testament === "old")
                            .map((book) => (
                                <option key={book.slug} value={book.slug}>
                                    {book.name}
                                </option>
                            ))}
                    </optgroup>
                    <optgroup label="New Testament">
                        {books
                            .filter((book) => book.testament === "new")
                            .map((book) => (
                                <option key={book.slug} value={book.slug}>
                                    {book.name}
                                </option>
                            ))}
                    </optgroup>
                </select>
            </label>

            <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-reading-text-muted">
                    Chapter
                </span>
                <select
                    value={currentChapter}
                    onChange={onChapterChange}
                    className={selectClassName}
                    aria-label="Select chapter"
                >
                    {(currentBook?.chapters ?? []).map((chapter) => (
                        <option
                            key={chapter.chapterNumber}
                            value={chapter.chapterNumber}
                        >
                            {chapter.chapterNumber}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}

const selectClassName = cn(
    "h-11 w-full rounded-md border border-reading-border bg-reading-surface-raised px-3 text-sm text-reading-text",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg",
);
