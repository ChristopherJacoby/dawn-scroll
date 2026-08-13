import { beforeEach, describe, expect, it } from "vitest";
import {
    addRecentSearch,
    clearRecentSearches,
    getSearchHistorySnapshot,
} from "./search-history";

class MemoryStorage {
    private store = new Map<string, string>();
    getItem(key: string) {
        return this.store.get(key) ?? null;
    }
    setItem(key: string, value: string) {
        this.store.set(key, value);
    }
    removeItem(key: string) {
        this.store.delete(key);
    }
}

beforeEach(() => {
    (globalThis as { window?: unknown }).window = {
        localStorage: new MemoryStorage(),
    };
    clearRecentSearches();
});

describe("search history", () => {
    it("starts empty", () => {
        expect(getSearchHistorySnapshot()).toEqual([]);
    });

    it("stores searches most recent first", () => {
        addRecentSearch("faith");
        addRecentSearch("hope");
        expect(getSearchHistorySnapshot()).toEqual(["hope", "faith"]);
    });

    it("ignores empty and whitespace-only queries", () => {
        addRecentSearch("");
        addRecentSearch("   ");
        expect(getSearchHistorySnapshot()).toEqual([]);
    });

    it("trims queries before storing", () => {
        addRecentSearch("  grace  ");
        expect(getSearchHistorySnapshot()).toEqual(["grace"]);
    });

    it("dedupes case-insensitively, moving the query to the front", () => {
        addRecentSearch("Faith");
        addRecentSearch("hope");
        addRecentSearch("faith");
        expect(getSearchHistorySnapshot()).toEqual(["faith", "hope"]);
    });

    it("keeps at most 10 entries, dropping the oldest", () => {
        for (let i = 1; i <= 12; i++) addRecentSearch(`query ${i}`);
        const list = getSearchHistorySnapshot();
        expect(list).toHaveLength(10);
        expect(list[0]).toBe("query 12");
        expect(list[9]).toBe("query 3");
    });

    it("clear empties the history", () => {
        addRecentSearch("faith");
        clearRecentSearches();
        expect(getSearchHistorySnapshot()).toEqual([]);
    });

    it("returns a stable reference between changes", () => {
        addRecentSearch("faith");
        expect(getSearchHistorySnapshot()).toBe(getSearchHistorySnapshot());
    });

    it("survives corrupted stored JSON", () => {
        (
            globalThis as unknown as { window: { localStorage: MemoryStorage } }
        ).window.localStorage.setItem(
            "dawnscroll.recent-searches",
            "{not json",
        );
        expect(getSearchHistorySnapshot()).toEqual([]);
    });
});
