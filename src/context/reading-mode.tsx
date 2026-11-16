"use client";

import {
    createContext,
    useContext,
    useState,
    useSyncExternalStore,
} from "react";

export type ReadingMode = "light" | "dark" | "sepia";

export const READING_MODE_STORAGE_KEY = "dawnscroll.reading-mode";
export const FONT_SCALE_STORAGE_KEY = "dawnscroll.font-scale";

export interface ReadingPreferences {
    mode: ReadingMode;
    fontScale: number;
}

interface ReadingModeContextValue extends ReadingPreferences {
    setMode: (mode: ReadingMode) => void;
    setFontScale: (scale: number) => void;
}

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Choices storage refused to keep; they still apply for this visit. */
const unsaved = new Map<string, string>();

function readStorage(key: string): string | null {
    const kept = unsaved.get(key);
    if (kept !== undefined) return kept;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string) {
    try {
        window.localStorage.setItem(key, value);
        unsaved.delete(key);
    } catch {
        // Private browsing or blocked storage.
        unsaved.set(key, value);
    }
}

function parseMode(value: string | null): ReadingMode {
    return value === "dark" || value === "sepia" ? value : "light";
}

function parseFontScale(value: string | null): number {
    const n = Number(value);
    return Number.isInteger(n) && n >= 80 && n <= 140 ? n : 100;
}

// Snapshots must be referentially stable between changes.
let cachedKey = "";
let cachedPrefs: ReadingPreferences = { mode: "light", fontScale: 100 };

function getSnapshot(): ReadingPreferences {
    const mode = parseMode(readStorage(READING_MODE_STORAGE_KEY));
    const fontScale = parseFontScale(readStorage(FONT_SCALE_STORAGE_KEY));
    const key = `${mode}:${fontScale}`;
    if (key !== cachedKey) {
        cachedKey = key;
        cachedPrefs = { mode, fontScale };
    }
    return cachedPrefs;
}

const SERVER_PREFS: ReadingPreferences = { mode: "light", fontScale: 100 };
function getServerSnapshot(): ReadingPreferences {
    return SERVER_PREFS;
}

function applyToDocument(prefs: ReadingPreferences) {
    document.body.dataset.readingMode = prefs.mode;
    document.body.style.setProperty(
        "--reading-font-scale",
        String(prefs.fontScale / 100),
    );
}

/**
 * Remembers one preference on this device and shows `next` on the page.
 * `next` is everything now in effect, not what this device has stored: a
 * signed-in reader's other preference comes from their account, and
 * re-reading storage here would reset it.
 */
function commit(key: string, value: string, next: ReadingPreferences) {
    writeStorage(key, value);
    applyToDocument(next);
    for (const listener of listeners) listener();
}

export function ReadingModeProvider({
    children,
    account,
}: {
    children: React.ReactNode;
    /** Signed-in user's saved preferences; these win over localStorage. */
    account?: ReadingPreferences | null;
}) {
    const local = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );
    // The account's saved preferences arrive once, with the page; changes
    // made since then win, or the controls would keep showing the saved
    // mode after a reader picks another.
    const [changed, setChanged] = useState<Partial<ReadingPreferences>>({});
    const prefs = account ? { ...account, ...changed } : local;

    return (
        <ReadingModeContext.Provider
            value={{
                ...prefs,
                setMode: (mode) => {
                    commit(READING_MODE_STORAGE_KEY, mode, { ...prefs, mode });
                    setChanged((c) => ({ ...c, mode }));
                },
                setFontScale: (fontScale) => {
                    commit(FONT_SCALE_STORAGE_KEY, String(fontScale), {
                        ...prefs,
                        fontScale,
                    });
                    setChanged((c) => ({ ...c, fontScale }));
                },
            }}
        >
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
