const STORAGE_KEY = "dawnscroll.recent-searches";
const MAX_ENTRIES = 10;

const EMPTY: string[] = [];
const listeners = new Set<() => void>();

// getSnapshot must return a referentially stable value between changes,
// so parse results are cached against the raw stored string.
let cachedRaw: string | null = null;
let cachedList: string[] = EMPTY;

function read(): string[] {
    let raw: string | null;
    try {
        raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return EMPTY;
    }
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        cachedList = Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : EMPTY;
    } catch {
        cachedList = EMPTY;
    }
    return cachedList;
}

function write(entries: string[]) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage unavailable — history just won't persist.
    }
    for (const listener of listeners) listener();
}

export function subscribeToSearchHistory(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getSearchHistorySnapshot(): string[] {
    return read();
}

export function getSearchHistoryServerSnapshot(): string[] {
    return EMPTY;
}

export function addRecentSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    const rest = read().filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    );
    write([trimmed, ...rest].slice(0, MAX_ENTRIES));
}

export function clearRecentSearches() {
    write([]);
}
