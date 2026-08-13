"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type ReadingMode = "light" | "dark" | "sepia";

export const READING_MODE_STORAGE_KEY = "dawnscroll.reading-mode";

interface ReadingModeContextValue {
    mode: ReadingMode;
    setMode: (mode: ReadingMode) => void;
}

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): ReadingMode {
    try {
        const stored = window.localStorage.getItem(READING_MODE_STORAGE_KEY);
        return stored === "dark" || stored === "sepia" ? stored : "light";
    } catch {
        return "light";
    }
}

function getServerSnapshot(): ReadingMode {
    return "light";
}

function setStoredMode(mode: ReadingMode) {
    try {
        window.localStorage.setItem(READING_MODE_STORAGE_KEY, mode);
    } catch {
        // Private browsing or blocked storage — mode still applies this visit.
    }
    document.body.dataset.readingMode = mode;
    for (const listener of listeners) listener();
}

export function ReadingModeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const mode = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    return (
        <ReadingModeContext.Provider value={{ mode, setMode: setStoredMode }}>
            {children}
        </ReadingModeContext.Provider>
    );
}

export function useReadingMode() {
    const ctx = useContext(ReadingModeContext);
    if (!ctx) {
        throw new Error(
            "useReadingMode must be used within ReadingModeProvider",
        );
    }
    return ctx;
}
