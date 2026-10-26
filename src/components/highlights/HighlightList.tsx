"use client";

import { Highlighter, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeHighlightAction } from "@/app/highlights/actions";
import { useRemovableList } from "@/components/library/useRemovableList";
import { verseReference } from "@/lib/annotations";
import { cn } from "@/lib/cn";
import { chapterReference } from "@/lib/bible/references";
import { HIGHLIGHT_BG, HIGHLIGHT_LABELS } from "@/lib/highlight-colors";
import type { Highlight } from "@/lib/highlights";
import { verseHref } from "@/lib/verse-ref";

interface ChapterGroup {
    key: string;
    bookName: string;
    chapterNumber: number;
    highlights: Highlight[];
}

/** Consecutive highlights (already in Bible order) grouped by chapter. */
function groupByChapter(highlights: Highlight[]): ChapterGroup[] {
    const groups: ChapterGroup[] = [];
    for (const highlight of highlights) {
        const key = `${highlight.bookSlug}-${highlight.chapterNumber}`;
        const last = groups.at(-1);
        if (last?.key === key) last.highlights.push(highlight);
        else
            groups.push({
                key,
                bookName: highlight.bookName,
                chapterNumber: highlight.chapterNumber,
                highlights: [highlight],
            });
    }
    return groups;
}

export function HighlightList({
    initialHighlights,
}: {
    initialHighlights: Highlight[];
}) {
    const { visible, removeItem } = useRemovableList(
        initialHighlights,
        removeHighlightAction,
        verseReference,
    );

    if (visible.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-reading-border-strong px-6 py-12 text-center">
                <Highlighter
                    className="h-6 w-6 text-reading-text-muted"
                    aria-hidden="true"
                />
                <p className="text-base text-reading-text">
                    No highlights yet.
                </p>
                <p className="max-w-sm text-sm text-reading-text-muted">
                    Tap a verse in the reader and pick a color to highlight it.
                </p>
                <Link
                    href="/reader"
                    className="mt-2 text-sm font-medium text-reading-link"
                >
                    Open the reader
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {groupByChapter(visible).map((group) => (
                <section
                    key={group.key}
                    aria-labelledby={`group-${group.key}`}
                    className="flex flex-col gap-3"
                >
                    <h2
                        id={`group-${group.key}`}
                        className="border-b border-reading-divider pb-2 font-serif text-2xl text-reading-text"
                    >
                        {chapterReference(group.bookName, group.chapterNumber)}
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {group.highlights.map((highlight) => (
                            <li
                                key={highlight.id}
                                className="flex items-start gap-2"
                            >
                                <Link
                                    href={verseHref(
                                        highlight.bookSlug,
                                        highlight.chapterNumber,
                                        highlight.verseNumber,
                                    )}
                                    className="flex min-w-0 flex-1 gap-3 rounded-md p-2 transition-colors hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                                >
                                    <span className="mt-1 shrink-0 font-sans text-xs font-semibold text-reading-text-muted">
                                        {highlight.verseNumber}
                                    </span>
                                    <span className="font-serif text-lg leading-relaxed text-reading-text">
                                        <span
                                            className={cn(
                                                "-mx-0.5 rounded-sm px-0.5 box-decoration-clone",
                                                HIGHLIGHT_BG[highlight.color],
                                            )}
                                        >
                                            {highlight.text}
                                        </span>
                                        <span className="sr-only">
                                            {" "}
                                            (
                                            {HIGHLIGHT_LABELS[
                                                highlight.color
                                            ].toLowerCase()}
                                            )
                                        </span>
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => removeItem(highlight)}
                                    aria-label={`Remove highlight: ${verseReference(highlight)}`}
                                    className="mt-1 rounded-md p-2.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                                >
                                    <Trash2
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
