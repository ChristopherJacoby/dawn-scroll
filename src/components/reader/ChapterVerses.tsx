"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkVerseAction } from "@/components/reader/BookmarkVerseAction";
import { CopyVerseAction } from "@/components/reader/CopyVerseAction";
import { HighlightVerseAction } from "@/components/reader/HighlightVerseAction";
import { VerseActionBar } from "@/components/reader/VerseActionBar";
import { VerseText } from "@/components/reader/VerseText";
import { useVerseAnnotations } from "@/components/reader/useVerseAnnotations";
import {
    addBookmarkAction,
    removeBookmarkAction,
} from "@/app/bookmarks/actions";
import {
    removeHighlightAction,
    setHighlightAction,
} from "@/app/highlights/actions";
import type { HighlightColor } from "@/lib/highlight-colors";
import type { VerseHighlight } from "@/lib/highlights";
import { ok } from "@/lib/result";

interface ChapterVersesProps {
    bookSlug: string;
    bookName: string;
    chapterNumber: number;
    translation: { slug: string; abbreviation: string };
    verses: { number: number; text: string }[];
    signedIn: boolean;
    /** Verse number → bookmark id for this chapter (empty when signed out). */
    bookmarks: Record<number, string>;
    /** Verse number → highlight for this chapter (empty when signed out). */
    highlights: Record<number, VerseHighlight>;
}

/**
 * The chapter's verses plus the selected-verse action bar. Remount per
 * chapter (via `key`) so a selection doesn't carry over on navigation.
 */
export function ChapterVerses({
    bookSlug,
    bookName,
    chapterNumber,
    translation,
    verses,
    signedIn,
    bookmarks: initialBookmarks,
    highlights: initialHighlights,
}: ChapterVersesProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const bookmarks = useVerseAnnotations(initialBookmarks);
    const highlights = useVerseAnnotations(initialHighlights);
    const signInHref = signedIn
        ? null
        : `/login?next=${encodeURIComponent(`/read/${bookSlug}/${chapterNumber}`)}`;
    const toolbarRef = useRef<HTMLDivElement>(null);
    const focusToolbar = useRef(false);

    const selectedVerse = verses.find((v) => v.number === selected) ?? null;
    const reference = selectedVerse
        ? `${bookName} ${chapterNumber}:${selectedVerse.number}`
        : "";

    function toggleBookmark(verse: number) {
        // "" stands in for the id until the server assigns one.
        bookmarks.update(
            verse,
            (id) => (id === undefined ? "" : undefined),
            async (id) => {
                if (id === undefined) {
                    return addBookmarkAction({
                        book: bookSlug,
                        chapter: chapterNumber,
                        verse,
                        translation: translation.slug,
                    });
                }
                const result = await removeBookmarkAction(id);
                // Already gone (e.g. removed on another page) is the goal.
                return result.ok || result.status === 404
                    ? ok(undefined)
                    : result;
            },
        );
    }

    function setHighlight(verse: number, color: HighlightColor | null) {
        highlights.update(
            verse,
            // "" stands in for a new highlight's id until the server's.
            (current) => (color ? { id: current?.id ?? "", color } : undefined),
            async (current) => {
                if (color) {
                    return setHighlightAction({
                        book: bookSlug,
                        chapter: chapterNumber,
                        verse,
                        translation: translation.slug,
                        color,
                    });
                }
                if (!current) return ok(undefined);
                const result = await removeHighlightAction(current.id);
                return result.ok || result.status === 404
                    ? ok(undefined)
                    : result;
            },
        );
    }

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
                        bookmarked={bookmarks.get(verse.number) !== undefined}
                        highlight={highlights.get(verse.number)?.color ?? null}
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
                    <HighlightVerseAction
                        color={
                            highlights.get(selectedVerse.number)?.color ?? null
                        }
                        onChange={(color) =>
                            setHighlight(selectedVerse.number, color)
                        }
                        signInHref={signInHref}
                    />
                    <BookmarkVerseAction
                        bookmarked={
                            bookmarks.get(selectedVerse.number) !== undefined
                        }
                        onToggle={() => toggleBookmark(selectedVerse.number)}
                        signInHref={signInHref}
                    />
                    <CopyVerseAction
                        text={selectedVerse.text}
                        reference={reference}
                        translation={translation.abbreviation}
                    />
                </VerseActionBar>
            )}
        </>
    );
}
