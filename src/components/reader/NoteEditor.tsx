"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerBody, DrawerFooter } from "@/components/ui/Drawer";
import { NOTE_MAX_LENGTH } from "@/lib/note-content";

const AUTOSAVE_DELAY_MS = 500;

interface NoteEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reference: string;
    verseText: string;
    /** The note as the page currently shows it ("" when there's none). */
    savedContent: string;
    saving: boolean;
    /** Persist the text; blank deletes the note. */
    onSave: (content: string) => void;
    /** The element to focus once the drawer has closed. */
    returnFocus: () => HTMLElement | null;
}

const sameNote = (a: string, b: string) =>
    (a.trim() ? a : "") === (b.trim() ? b : "");

/**
 * Bottom-drawer note editor. Saves 500ms after typing pauses, and
 * immediately on blur or close, so nothing typed is lost. Remount per
 * verse (via `key`).
 */
export function NoteEditor({
    open,
    onOpenChange,
    reference,
    verseText,
    savedContent,
    saving,
    onSave,
    returnFocus,
}: NoteEditorProps) {
    const [text, setText] = useState(savedContent);
    const [dirty, setDirty] = useState(false);
    const latestText = useRef(savedContent);
    // What the server has or will have: the pending target while a save is
    // in flight, reverting to the server's value if it fails. Comparing
    // against this (not "what we last sent") means a failed save is resent
    // on the next flush, including on close and unmount.
    const saved = useRef(savedContent);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textareaId = useId();
    const statusId = useId();

    function flush() {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        setDirty(false);
        if (sameNote(latestText.current, saved.current)) return;
        onSave(latestText.current);
    }

    function change(value: string) {
        setText(value);
        latestText.current = value;
        setDirty(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
    }

    function remove() {
        change("");
        flush();
        onOpenChange(false);
    }

    // Keep refs current for timers and for the unmount flush, which saves
    // whatever is pending if the editor unmounts mid-debounce.
    const flushOnUnmount = useRef(flush);
    useEffect(() => {
        saved.current = savedContent;
        flushOnUnmount.current = flush;
    });
    useEffect(() => () => flushOnUnmount.current(), []);

    const failed = !dirty && !saving && !sameNote(text, savedContent);
    const status = dirty
        ? "Unsaved changes"
        : saving
          ? "Saving…"
          : failed
            ? "Not saved."
            : savedContent
              ? "Saved"
              : "";

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => {
                if (!next) flush();
                onOpenChange(next);
            }}
            title={`Note on ${reference}`}
            onCloseAutoFocus={(event) => {
                const target = returnFocus();
                if (!target) return;
                event.preventDefault();
                target.focus({ preventScroll: true });
            }}
            className="md:inset-x-auto md:left-1/2 md:w-[min(40rem,calc(100%-2rem))] md:-translate-x-1/2"
        >
            <DrawerBody className="flex flex-col gap-3">
                <blockquote className="line-clamp-3 border-l-2 border-reading-divider pl-3 font-serif text-base text-reading-text-muted">
                    {verseText}
                </blockquote>
                <label htmlFor={textareaId} className="sr-only">
                    Your note
                </label>
                <textarea
                    id={textareaId}
                    value={text}
                    onChange={(event) => change(event.target.value)}
                    onBlur={flush}
                    maxLength={NOTE_MAX_LENGTH}
                    rows={6}
                    autoFocus
                    aria-describedby={statusId}
                    placeholder="Write a thought, a question, a prayer…"
                    className="w-full resize-y rounded-md border border-reading-border-strong bg-reading-bg px-3 py-2 text-base text-reading-text placeholder:text-reading-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                />
                <div className="flex items-center justify-between text-xs text-reading-text-muted">
                    <span id={statusId} role="status">
                        {status}
                        {failed && (
                            <button
                                type="button"
                                onClick={flush}
                                className="ml-2 font-medium text-reading-link"
                            >
                                Retry
                            </button>
                        )}
                    </span>
                    <span className="tabular-nums">
                        {text.length.toLocaleString()} /{" "}
                        {NOTE_MAX_LENGTH.toLocaleString()}
                    </span>
                </div>
            </DrawerBody>
            <DrawerFooter className="justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={remove}
                    disabled={!savedContent && !text.trim()}
                    className="text-reading-danger"
                >
                    {/* Nothing is saved yet, so this only throws the draft away. */}
                    {savedContent ? "Delete note" : "Discard"}
                </Button>
                <Button size="sm" onClick={() => onOpenChange(false)}>
                    Done
                </Button>
            </DrawerFooter>
        </Drawer>
    );
}
