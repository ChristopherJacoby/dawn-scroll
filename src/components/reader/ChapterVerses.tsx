"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AskVerseAction } from "@/components/reader/AskVerseAction";
import { BookmarkVerseAction } from "@/components/reader/BookmarkVerseAction";
import { CopyVerseAction } from "@/components/reader/CopyVerseAction";
import { DigDeeper } from "@/components/reader/DigDeeper";
import { JourneyMarker } from "@/components/reader/JourneyMarker";
import { HighlightVerseAction } from "@/components/reader/HighlightVerseAction";
import { NoteEditor } from "@/components/reader/NoteEditor";
import { NoteVerseAction } from "@/components/reader/NoteVerseAction";
import { OriginalVerseAction } from "@/components/reader/OriginalVerseAction";
import { VerseActionBar } from "@/components/reader/VerseActionBar";
import { VerseText } from "@/components/reader/VerseText";
import { useVerseAnnotations } from "@/components/reader/useVerseAnnotations";
import { useVerseLayout } from "@/components/reader/useVerseLayout";
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
import { findingMarkers } from "@/lib/archaeology/refs";
import type { FindingSummary } from "@/lib/archaeology/types";
import type { Journey } from "@/lib/bible/journeys";
import { chapterReference } from "@/lib/bible/references";
import { groupVerses, type LayoutMarks } from "@/lib/bible/verse-blocks";
import type { HighlightColor } from "@/lib/highlight-colors";
import type { VerseHighlight } from "@/lib/highlights";
import type { VerseNote } from "@/lib/notes";
import { ok } from "@/lib/result";

interface ChapterVersesProps {
    bookSlug: string;
    bookName: string;
    chapterNumber: number;
    /** languageCode marks verse text that isn't English for screen readers. */
    translation: { slug: string; abbreviation: string; languageCode: string };
    verses: { number: number; text: string }[];
    signedIn: boolean;
    /** Verse number → bookmark id for this chapter (empty when signed out). */
    bookmarks: Record<number, string>;
    /** Verse number → highlight for this chapter (empty when signed out). */
    highlights: Record<number, VerseHighlight>;
    /** Verse number → note for this chapter (empty when signed out). */
    notes: Record<number, VerseNote>;
    /** Archaeological findings with a reference in this chapter. */
    findings: FindingSummary[];
    /** Whether Scholar chat is available, for the Ask action. */
    aiEnabled: boolean;
    /** Where paragraphs, poetry and stanzas fall, for paragraph layout. */
    layout: LayoutMarks | null;
    /** Journeys with a map marker in this chapter, and the verse it's on. */
    journeys: { verse: number; journey: Journey }[];
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
    findings,
    aiEnabled,
    layout,
    journeys,
}: ChapterVersesProps) {
    const verseLayout = useVerseLayout();
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

    const markers = findingMarkers(findings, bookSlug, chapterNumber);
    const selectedVerse = verses.find((v) => v.number === selected) ?? null;
    const noteTarget =
        noteVerse === null
            ? null
            : (verses.find((v) => v.number === noteVerse) ?? null);

    const reference = selectedVerse
        ? `${chapterReference(bookName, chapterNumber)}:${selectedVerse.number}`
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

    const blocks =
        verseLayout === "paragraphs" && layout
            ? groupVerses(verses, layout)
            : null;

    function renderVerse(
        verse: (typeof verses)[number],
        variant: "block" | "inline" | "line",
    ) {
        return (
            <VerseText
                key={verse.number}
                number={verse.number}
                text={verse.text}
                variant={variant}
                selected={verse.number === selected}
                bookmarked={bookmarks.get(verse.number) !== undefined}
                highlight={highlights.get(verse.number)?.color ?? null}
                hasNote={notes.get(verse.number) !== undefined}
                study={wordStudy.render(verse.number, verse.text)}
                markers={
                    <>
                        {markers.has(verse.number) && (
                            <DigDeeper findings={markers.get(verse.number)!} />
                        )}
                        {journeys
                            .filter((j) => j.verse === verse.number)
                            .map(({ journey }) => (
                                <JourneyMarker
                                    key={journey.slug}
                                    journey={journey}
                                />
                            ))}
                    </>
                }
                onToggle={toggle}
            />
        );
    }

    return (
        <>
            <div
                lang={
                    translation.languageCode === "en"
                        ? undefined
                        : translation.languageCode
                }
                className="selection-reading reading-scale flex flex-col gap-4 font-serif text-reading-text"
            >
                {blocks
                    ? blocks.map((block) => {
                          const key = block.verses[0].number;
                          if (block.kind === "poetry") {
                              return (
                                  <div
                                      key={key}
                                      className="flex flex-col gap-1"
                                  >
                                      {block.verses.map((v) =>
                                          renderVerse(v, "line"),
                                      )}
                                  </div>
                              );
                          }
                          // A verse in word study needs room beneath it.
                          if (
                              block.verses.some(
                                  (v) => v.number === wordStudy.verse,
                              )
                          ) {
                              return (
                                  <div
                                      key={key}
                                      className="flex flex-col gap-4"
                                  >
                                      {block.verses.map((v) =>
                                          renderVerse(v, "block"),
                                      )}
                                  </div>
                              );
                          }
                          return (
                              <p key={key}>
                                  {block.verses.map((v, i) => (
                                      <Fragment key={v.number}>
                                          {i > 0 && " "}
                                          {renderVerse(v, "inline")}
                                      </Fragment>
                                  ))}
                              </p>
                          );
                      })
                    : verses.map((verse) => renderVerse(verse, "block"))}
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
                    {aiEnabled && (
                        <AskVerseAction
                            bookSlug={bookSlug}
                            chapterNumber={chapterNumber}
                            verse={selectedVerse.number}
                        />
                    )}
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
                    reference={`${chapterReference(bookName, chapterNumber)}:${noteTarget.number}`}
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
