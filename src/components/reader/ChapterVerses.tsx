"use client";

import { useEffect, useRef, useState } from "react";
import { CopyVerseAction } from "@/components/reader/CopyVerseAction";
import { VerseActionBar } from "@/components/reader/VerseActionBar";
import { VerseText } from "@/components/reader/VerseText";

interface ChapterVersesProps {
    bookName: string;
    chapterNumber: number;
    translation: string;
    verses: { number: number; text: string }[];
}

/**
 * The chapter's verses plus the selected-verse action bar. Remount per
 * chapter (via `key`) so a selection doesn't carry over on navigation.
 */
export function ChapterVerses({
    bookName,
    chapterNumber,
    translation,
    verses,
}: ChapterVersesProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const focusToolbar = useRef(false);

    const selectedVerse = verses.find((v) => v.number === selected) ?? null;
    const reference = selectedVerse
        ? `${bookName} ${chapterNumber}:${selectedVerse.number}`
        : "";

    function toggle(number: number, viaKeyboard: boolean) {
        const next = number === selected ? null : number;
        focusToolbar.current = viaKeyboard && next !== null;
        setSelected(next);
    }

    function close() {
        const number = selected;
        const focusInToolbar = toolbarRef.current?.contains(
            document.activeElement,
        );
        setSelected(null);
        // Hand focus back to the verse rather than dropping it on <body>
        // when the toolbar unmounts — without scrolling back up to it.
        if (number !== null && focusInToolbar) {
            document
                .querySelector<HTMLButtonElement>(
                    `[data-verse-button="${number}"]`,
                )
                ?.focus({ preventScroll: true });
        }
    }

    // Keyboard selection moves focus into the toolbar so its actions are
    // one Tab away rather than past every remaining verse.
    useEffect(() => {
        if (focusToolbar.current) {
            focusToolbar.current = false;
            toolbarRef.current?.focus();
        }
    }, [selected]);

    useEffect(() => {
        if (selected === null) return;
        function onKeyDown(event: KeyboardEvent) {
            // A dialog or popover opened from the toolbar handles its own
            // Escape (and prevents default); only close on a bare Escape.
            if (event.key === "Escape" && !event.defaultPrevented) close();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    });

    return (
        <>
            <div className="selection-reading reading-scale flex flex-col gap-4 font-serif text-reading-text">
                {verses.map((verse) => (
                    <VerseText
                        key={verse.number}
                        number={verse.number}
                        text={verse.text}
                        selected={verse.number === selected}
                        onToggle={toggle}
                    />
                ))}
            </div>
            {selectedVerse && (
                // Keyed per verse so each action's state (e.g. "Copied")
                // resets when the selection moves.
                <VerseActionBar
                    key={selectedVerse.number}
                    ref={toolbarRef}
                    reference={reference}
                    onClose={close}
                >
                    <CopyVerseAction
                        text={selectedVerse.text}
                        reference={reference}
                        translation={translation}
                    />
                </VerseActionBar>
            )}
        </>
    );
}
