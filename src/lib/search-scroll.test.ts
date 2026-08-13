import { beforeEach, describe, expect, it } from "vitest";
import {
    consumeSearchScrollPosition,
    saveSearchScrollPosition,
} from "./search-scroll";

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

let storage: MemoryStorage;

beforeEach(() => {
    storage = new MemoryStorage();
    (globalThis as { window?: unknown }).window = {
        sessionStorage: storage,
        scrollY: 0,
    };
});

describe("search scroll position", () => {
    it("returns null when nothing was saved", () => {
        expect(consumeSearchScrollPosition()).toBeNull();
    });

    it("round-trips the saved scroll position", () => {
        (
            globalThis as unknown as { window: { scrollY: number } }
        ).window.scrollY = 840;
        saveSearchScrollPosition();
        expect(consumeSearchScrollPosition()).toBe(840);
    });

    it("consumes the value — a second read returns null", () => {
        saveSearchScrollPosition();
        consumeSearchScrollPosition();
        expect(consumeSearchScrollPosition()).toBeNull();
    });

    it("rejects corrupted stored values", () => {
        storage.setItem("dawnscroll.search-scroll", "not-a-number");
        expect(consumeSearchScrollPosition()).toBeNull();
        storage.setItem("dawnscroll.search-scroll", "-50");
        expect(consumeSearchScrollPosition()).toBeNull();
    });
});
