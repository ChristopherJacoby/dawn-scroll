"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, type ChangeEvent } from "react";
import { setTranslationAction } from "@/app/read/actions";
import type { BookWithChapters } from "@/lib/bible/types";
import { cn } from "@/lib/cn";
import { VerseLayoutToggle } from "./VerseLayoutToggle";
import { useToast } from "@/context/toast";

interface TranslationOption {
    slug: string;
    abbreviation: string;
    name: string;
}

interface ReaderSelectorsProps {
    books: BookWithChapters[];
    currentBookSlug: string;
    currentChapter: number;
    translations: TranslationOption[];
    currentTranslation: string;
}

export function ReaderSelectors({
    books,
    currentBookSlug,
    currentChapter,
    translations,
    currentTranslation,
}: ReaderSelectorsProps) {
    const router = useRouter();
    const toast = useToast();
    const currentBook = books.find((book) => book.slug === currentBookSlug);
    const [isSwitching, startTransition] = useTransition();
    // Shows the new choice while the chapter re-renders in it.
    const [translation, setOptimisticTranslation] =
        useOptimistic(currentTranslation);

    function navigate(bookSlug: string, chapter: number) {
        router.push(`/read/${bookSlug}/${chapter}`);
    }

    function onBookChange(event: ChangeEvent<HTMLSelectElement>) {
        navigate(event.target.value, 1);
    }

    function onChapterChange(event: ChangeEvent<HTMLSelectElement>) {
        navigate(currentBookSlug, Number(event.target.value));
    }

    function onTranslationChange(event: ChangeEvent<HTMLSelectElement>) {
        const slug = event.target.value;
        startTransition(async () => {
            setOptimisticTranslation(slug);
            // A failed call (offline, or a deploy since this page loaded)
            // throws; without the catch it would take down the page.
            const result = await setTranslationAction(slug).catch(() => null);
            if (!result) {
                toast.error("Something went wrong. Please try again.");
            } else if (!result.ok) {
                toast.error(result.error);
            }
        });
    }

    return (
        // Book and chapter share a row until there's room for the rest;
        // the book column never shrinks below its longest name. Layout
        // gets its own row until xl.
        <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3 lg:grid-cols-[minmax(10rem,1fr)_7rem_minmax(0,16rem)] xl:grid-cols-[minmax(10rem,1fr)_6rem_minmax(0,15rem)_auto]">
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

            <label className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
                <span className="text-xs font-medium text-reading-text-muted">
                    Translation
                </span>
                <select
                    value={translation}
                    onChange={onTranslationChange}
                    aria-busy={isSwitching}
                    className={cn(
                        selectClassName,
                        isSwitching && "cursor-progress",
                    )}
                    aria-label="Select translation"
                >
                    {translations.map((option) => (
                        <option key={option.slug} value={option.slug}>
                            {option.name} ({option.abbreviation})
                        </option>
                    ))}
                </select>
            </label>
            <div className="col-span-2 flex flex-col gap-1.5 sm:max-w-xs lg:col-span-3 xl:col-span-1">
                <span className="text-xs font-medium text-reading-text-muted">
                    Layout
                </span>
                <VerseLayoutToggle />
            </div>
        </div>
    );
}

const selectClassName = cn(
    "h-11 w-full rounded-md border border-reading-border-strong bg-reading-surface-raised px-3 text-sm text-reading-text",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg",
);
