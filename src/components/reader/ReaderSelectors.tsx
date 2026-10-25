"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, type ChangeEvent } from "react";
import { setTranslationAction } from "@/app/read/actions";
import type { BookWithChapters } from "@/lib/bible/types";
import { cn } from "@/lib/cn";
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
            const result = await setTranslationAction(slug);
            if (!result.ok) toast.error(result.error);
        });
    }

    return (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem_minmax(0,16rem)]">
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

            <label className="flex flex-col gap-1.5">
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
        </div>
    );
}

const selectClassName = cn(
    "h-11 w-full rounded-md border border-reading-border-strong bg-reading-surface-raised px-3 text-sm text-reading-text",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg",
);
