"use client";

import { NotebookPen, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeNoteAction } from "@/app/notes/actions";
import { useRemovableList } from "@/components/library/useRemovableList";
import { LocalDate } from "@/components/ui/LocalDate";
import { verseReference } from "@/lib/annotations";
import type { Note } from "@/lib/notes";
import { verseHref } from "@/lib/verse-ref";

const PREVIEW_LENGTH = 80;

/** First 80 characters, counting by code point so emoji aren't split. */
function preview(content: string) {
    const chars = Array.from(content.trim().replace(/\s+/g, " "));
    return chars.length > PREVIEW_LENGTH
        ? `${chars.slice(0, PREVIEW_LENGTH).join("").trimEnd()}…`
        : chars.join("");
}

export function NoteList({ initialNotes }: { initialNotes: Note[] }) {
    const { visible, removeItem } = useRemovableList(
        initialNotes,
        removeNoteAction,
        (note) => `the note on ${verseReference(note)}`,
    );

    if (visible.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-reading-border-strong px-6 py-12 text-center">
                <NotebookPen
                    className="h-6 w-6 text-reading-text-muted"
                    aria-hidden="true"
                />
                <p className="text-base text-reading-text">No notes yet.</p>
                <p className="max-w-sm text-sm text-reading-text-muted">
                    Tap a verse in the reader and choose Note to write down a
                    thought.
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
        <ul className="flex flex-col gap-3">
            {visible.map((note) => (
                <li
                    key={note.id}
                    className="flex items-start gap-2 rounded-lg border border-reading-border-strong bg-reading-surface-raised"
                >
                    <Link
                        href={verseHref(
                            note.bookSlug,
                            note.chapterNumber,
                            note.verseNumber,
                        )}
                        className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg p-4 transition-colors hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
                            <span className="font-semibold text-reading-text">
                                {verseReference(note)}
                            </span>
                            <span className="text-xs text-reading-text-muted">
                                Edited <LocalDate iso={note.updatedAt} />
                            </span>
                        </span>
                        <span className="line-clamp-2 border-l-2 border-reading-divider pl-3 font-serif text-sm text-reading-text-muted">
                            {note.text}
                        </span>
                        <span className="text-base text-reading-text">
                            {preview(note.content)}
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => removeItem(note)}
                        aria-label={`Delete note: ${verseReference(note)}`}
                        className="m-2 rounded-md p-2.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </li>
            ))}
        </ul>
    );
}
