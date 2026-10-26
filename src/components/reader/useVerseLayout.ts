"use client";

import { useSyncExternalStore } from "react";

/** Prose in paragraphs (poetry in lines), or one verse per line. */
export type VerseLayout = "paragraphs" | "verses";

const STORAGE_KEY = "dawnscroll.verse-layout";
const listeners = new Set<() => void>();
// This visit's choice, so it holds even when storage is blocked.
let chosen: VerseLayout | null = null;

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): VerseLayout {
    if (chosen) return chosen;
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "verses"
            ? "verses"
            : "paragraphs";
    } catch {
        return "paragraphs";
    }
}

export function setVerseLayout(layout: VerseLayout) {
    chosen = layout;
    try {
        window.localStorage.setItem(STORAGE_KEY, layout);
    } catch {
        // Private browsing or blocked storage: holds for this visit.
    }
    for (const listener of listeners) listener();
}

/** The reader's text layout, kept in this browser (paragraphs by default). */
export function useVerseLayout(): VerseLayout {
    return useSyncExternalStore(subscribe, getSnapshot, () => "paragraphs");
}
