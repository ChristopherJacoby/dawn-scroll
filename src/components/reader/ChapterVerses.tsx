"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkVerseAction } from "@/components/reader/BookmarkVerseAction";
import { CopyVerseAction } from "@/components/reader/CopyVerseAction";
import { HighlightVerseAction } from "@/components/reader/HighlightVerseAction";
import { NoteEditor } from "@/components/reader/NoteEditor";
import { NoteVerseAction } from "@/components/reader/NoteVerseAction";
import { OriginalVerseAction } from "@/components/reader/OriginalVerseAction";
import { VerseActionBar } from "@/components/reader/VerseActionBar";
import { VerseText } from "@/components/reader/VerseText";
import { useVerseAnnotations } from "@/components/reader/useVerseAnnotations";
import { useWordStudy } from "@/components/reader/useWordStudy";
import {
    addBookmarkAction,
    removeBookmarkAction,
} from "@/app/bookmarks/actions";
import {
    removeHighlightAction,
    setHighlightAction,
} from "@/app/highlights/actions";
import { saveNoteAction } from "@/app/notes/actions";
import type { HighlightColor } from "@/lib/highlight-colors";
import type { VerseHighlight } from "@/lib/highlights";
import type { VerseNote } from "@/lib/notes";
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
    /** Verse number → note for this chapter (empty when signed out). */
    notes: Record<number, VerseNote>;
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
    notes: initialNotes,
}: ChapterVersesProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const bookmarks = useVerseAnnotations(initialBookmarks);
    const highlights = useVerseAnnotations(initialHighlights);
    const notes = useVerseAnnotations(initialNotes);
    const wordStudy = useWordStudy({
        bookSlug,
        chapterNumber,
        translation: translation.slug,
    });
    // The editor keeps its verse while closing so the drawer can animate out.
    const [noteVerse, setNoteVerse] = useState<number | null>(null);
    const [noteOpen, setNoteOpen] = useState(false);
    const signInHref = signedIn
        ? null
        : `/login?next=${encodeURIComponent(`/read/${bookSlug}/${chapterNumber}`)}`;
    const toolbarRef = useRef<HTMLDivElement>(null);
    const focusToolbar = useRef(false);

    const selectedVerse = verses.find((v) => v.number === selected) ?? null;
    const noteTarget =
        noteVerse === null
            ? null
            : (verses.find((v) => v.number === noteVerse) ?? null);

    const reference = selectedVerse
        ? `${bookName} ${chapterNumber}:${selectedVerse.number}`
        : "";

    const verseRef = (verse: number) => ({
        book: bookSlug,
        chapter: chapterNumber,
        verse,
        translation: translation.slug,
    });

    function toggleBookmark(verse: number) {
        // Toggle what's on screen; "" stands in for the id until the
        // server assigns one.
        const target = bookmarks.latest(verse) === undefined ? "" : undefined;
        bookmarks.update(verse, target, async (settledId, wanted) => {
            if (wanted !== undefined) {
                return settledId !== undefined
                    ? ok(settledId)
                    : addBookmarkAction(verseRef(verse));
            }
            if (settledId === undefined) return ok(undefined);
            const result = await removeBookmarkAction(settledId);
            // Already gone (e.g. removed on another page) is the goal.
            return result.ok || result.status === 404 ? ok(undefined) : result;
        });
    }

    function setHighlight(verse: number, color: HighlightColor | null) {
        const shown = highlights.latest(verse);
        // "" stands in for a new highlight's id until the server's.
        const target = color ? { id: shown?.id ?? "", color } : undefined;
        highlights.update(verse, target, async (settled, wanted) => {
            if (wanted) {
                return settled?.color === wanted.color
                    ? ok(settled)
                    : setHighlightAction({
                          ...verseRef(verse),
                          color: wanted.color,
                      });
            }
            if (!settled) return ok(undefined);
            const result = await removeHighlightAction(settled.id);
            return result.ok || result.status === 404 ? ok(undefined) : result;
        });
    }

    function saveNote(verse: number, content: string) {
        const shown = notes.latest(verse);
        // Blank text deletes the note; "" stands in for a new note's id.
        const target = content.trim()
            ? { id: shown?.id ?? "", content }
            : undefined;
        notes.update(verse, target, async (settled, wanted) => {
            if (settled?.content === wanted?.content) return ok(settled);
            // Saving blank text deletes the verse's note (by verse, so it's
            // safe to repeat and needs no id).
            return saveNoteAction({
                ...verseRef(verse),
                content: wanted?.content ?? "",
            });
        });
    }

    function toggle(number: number, viaKeyboard: boolean) {
        const next = number === selected ? null : number;
        if (wordStudy.verse !== null && wordStudy.verse !== next) {
            wordStudy.stop();
        }
        focusToolbar.current = viaKeyboard && next !== null;
        setSelected(next);
    }

    function close() {
        const number = selected;
        wordStudy.stop();
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
                        hasNote={notes.get(verse.number) !== undefined}
                        study={wordStudy.render(verse.number, verse.text)}
                        onToggle={toggle}
                    />
                ))}
            </div>
            {selectedVerse && (
                // Keyed per verse so each action's state (e.g. "Copied")
                // resets when the selection moves.
                <VerseActionBar
                    key={`bar-${selectedVerse.number}`}
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
                    <OriginalVerseAction
                        active={wordStudy.verse === selectedVerse.number}
                        loading={wordStudy.isLoading(selectedVerse.number)}
                        onToggle={() => wordStudy.toggle(selectedVerse.number)}
                    />
                    <NoteVerseAction
                        hasNote={notes.get(selectedVerse.number) !== undefined}
                        onOpen={() => {
                            setNoteVerse(selectedVerse.number);
                            setNoteOpen(true);
                        }}
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
            {noteTarget && (
                <NoteEditor
                    key={`note-${noteTarget.number}`}
                    open={noteOpen}
                    onOpenChange={setNoteOpen}
                    reference={`${bookName} ${chapterNumber}:${noteTarget.number}`}
                    verseText={noteTarget.text}
                    savedContent={notes.get(noteTarget.number)?.content ?? ""}
                    saving={notes.isPending(noteTarget.number)}
                    onSave={(content) => saveNote(noteTarget.number, content)}
                    returnFocus={() =>
                        toolbarRef.current?.querySelector<HTMLElement>(
                            "[aria-haspopup=dialog]",
                        ) ??
                        document.querySelector<HTMLElement>(
                            `[data-verse-button="${noteTarget.number}"]`,
                        )
                    }
                />
            )}
        </>
    );
}
