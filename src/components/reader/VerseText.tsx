"use client";

import { cn } from "@/lib/cn";

interface VerseTextProps {
    number: number;
    text: string;
    selected: boolean;
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
    onToggle,
}: VerseTextProps) {
    function handleVerseClick(event: React.MouseEvent<HTMLParagraphElement>) {
        // Clicks on the number button are handled by the button itself.
        if ((event.target as HTMLElement).closest("button")) return;
        // Second click of a double-click, or a drag that selected text.
        if (event.detail > 1) return;
        if (window.getSelection()?.toString()) return;
        onToggle(number, false);
    }

    return (
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
                    onClick={(event) => onToggle(number, event.detail === 0)}
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
            </sup>
            <span
                className={cn(
                    selected &&
                        "underline decoration-dotted decoration-2 underline-offset-[0.3em] decoration-[var(--reading-border-strong)]",
                )}
            >
                {text}
            </span>
        </p>
    );
}
