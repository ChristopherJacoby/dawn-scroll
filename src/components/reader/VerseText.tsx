"use client";

import { Bookmark, NotebookPen } from "lucide-react";
import { cn } from "@/lib/cn";
import {
    HIGHLIGHT_BG,
    HIGHLIGHT_LABELS,
    type HighlightColor,
} from "@/lib/highlight-colors";

interface VerseTextProps {
    number: number;
    text: string;
    selected: boolean;
    bookmarked: boolean;
    highlight: HighlightColor | null;
    hasNote: boolean;
    /**
     * Word study, when active: the text (with tappable words where they're
     * linked), a hint, and anything to show beneath the verse.
     */
    study?: { content: React.ReactNode; hint: string; below?: React.ReactNode };
    /** Marker for archaeological findings that start at this verse. */
    dig?: React.ReactNode;
    onToggle: (number: number, viaKeyboard: boolean) => void;
}

/**
 * One verse: number + text, tap-to-select. The verse number is the
 * keyboard/screen-reader control; tapping anywhere on the verse is the
 * pointer shortcut, skipped when the reader is selecting text to copy.
 */
export function VerseText({
    number,
    text,
    selected,
    bookmarked,
    highlight,
    hasNote,
    study,
    dig,
    onToggle,
}: VerseTextProps) {
    function handleVerseClick(event: React.MouseEvent<HTMLParagraphElement>) {
        // React bubbles clicks out of portals (e.g. a word-study card) to
        // here; only clicks on the verse itself count.
        if (!event.currentTarget.contains(event.target as Node)) return;
        // Clicks on the number button are handled by the button itself.
        if ((event.target as HTMLElement).closest("button")) return;
        // In word study, a near-miss on a word shouldn't end the study.
        if (study) return;
        // Second click of a double-click, or a drag that selected text.
        if (event.detail > 1) return;
        if (window.getSelection()?.toString()) return;
        onToggle(number, false);
    }

    return (
        <>
            <p
                id={`verse-${number}`}
                className="scroll-mt-24 cursor-pointer"
                onClick={handleVerseClick}
            >
                <sup className="mr-2 align-super">
                    <button
                        type="button"
                        data-verse-button={number}
                        aria-label={`Verse ${number}`}
                        aria-pressed={selected}
                        onClick={(event) =>
                            onToggle(number, event.detail === 0)
                        }
                        className={cn(
                            "rounded-sm px-0.5 font-sans text-xs font-semibold transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                            selected
                                ? "bg-reading-accent text-reading-accent-contrast"
                                : "text-reading-text-muted",
                        )}
                    >
                        {number}
                    </button>
                    {bookmarked && (
                        <>
                            <Bookmark
                                className="ml-0.5 inline h-3 w-3 fill-current text-reading-accent"
                                aria-hidden="true"
                            />
                            <span className="sr-only">(bookmarked)</span>
                        </>
                    )}
                    {hasNote && (
                        <>
                            <NotebookPen
                                className="ml-0.5 inline h-3 w-3 text-reading-accent"
                                aria-hidden="true"
                            />
                            <span className="sr-only">(has a note)</span>
                        </>
                    )}
                    {highlight && (
                        <span className="sr-only">
                            (highlighted{" "}
                            {HIGHLIGHT_LABELS[highlight].toLowerCase()})
                        </span>
                    )}
                    {dig}
                </sup>
                <span
                    className={cn(
                        highlight &&
                            cn(
                                "-mx-0.5 rounded-sm px-0.5 box-decoration-clone",
                                HIGHLIGHT_BG[highlight],
                            ),
                        selected &&
                            !study &&
                            "underline decoration-dotted decoration-2 underline-offset-[0.3em] decoration-[var(--reading-border-strong)]",
                    )}
                >
                    {study?.content ?? text}
                </span>
            </p>
            {study && (
                <p className="-mt-3 font-sans text-xs text-reading-text-muted">
                    {study.hint}
                </p>
            )}
            {study?.below}
        </>
    );
}
