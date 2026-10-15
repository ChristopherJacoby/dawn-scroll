import { describe, expect, it } from "vitest";
import { CREDIBILITY_ORDER, isCredibilityRating } from "./credibility";
import {
    formatScriptureRef,
    refRangeInChapter,
    scriptureRefHref,
} from "./refs";
import type { FindingScriptureRef } from "./types";

const ref = (
    chapterStart: number,
    verseStart: number,
    chapterEnd: number,
    verseEnd: number,
): FindingScriptureRef => ({
    bookSlug: "2-kings",
    bookName: "2 Kings",
    chapterStart,
    verseStart,
    chapterEnd,
    verseEnd,
});

describe("formatScriptureRef", () => {
    it("formats single verses, ranges, and cross-chapter ranges", () => {
        expect(formatScriptureRef(ref(20, 20, 20, 20))).toBe("2 Kings 20:20");
        expect(formatScriptureRef(ref(3, 4, 3, 27))).toBe("2 Kings 3:4–27");
        expect(formatScriptureRef(ref(18, 13, 19, 37))).toBe(
            "2 Kings 18:13–19:37",
        );
    });
});

describe("scriptureRefHref", () => {
    it("links to the first verse in the reader", () => {
        expect(scriptureRefHref(ref(18, 13, 19, 37))).toBe(
            "/read/2-kings/18#verse-13",
        );
    });
});

describe("refRangeInChapter", () => {
    const span = ref(18, 13, 20, 5);

    it("is null outside the reference", () => {
        expect(refRangeInChapter(span, 17)).toBeNull();
        expect(refRangeInChapter(span, 21)).toBeNull();
    });

    it("clips to the chapter", () => {
        expect(refRangeInChapter(span, 18)).toEqual({ first: 13, last: null });
        expect(refRangeInChapter(span, 19)).toEqual({ first: 1, last: null });
        expect(refRangeInChapter(span, 20)).toEqual({ first: 1, last: 5 });
        expect(refRangeInChapter(ref(3, 4, 3, 27), 3)).toEqual({
            first: 4,
            last: 27,
        });
    });
});

describe("credibility", () => {
    it("orders ratings strongest first and validates input", () => {
        expect(CREDIBILITY_ORDER).toEqual([
            "established",
            "supported",
            "debated",
            "unverified",
        ]);
        expect(isCredibilityRating("debated")).toBe(true);
        expect(isCredibilityRating("toString")).toBe(false);
        expect(isCredibilityRating(null)).toBe(false);
    });
});
