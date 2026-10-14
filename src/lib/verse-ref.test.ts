import { describe, expect, it } from "vitest";
import { compareCanonical, isUuid, parseVerseRef } from "./verse-ref";

describe("parseVerseRef", () => {
    it("accepts a full reference", () => {
        expect(
            parseVerseRef({
                book: "1-john",
                chapter: 3,
                verse: 16,
                translation: "kjv",
            }),
        ).toEqual({
            book: "1-john",
            chapter: 3,
            verse: 16,
            translation: "kjv",
        });
    });

    it("defaults the translation to KJV", () => {
        expect(parseVerseRef({ book: "john", chapter: 3, verse: 16 })).toEqual({
            book: "john",
            chapter: 3,
            verse: 16,
            translation: "kjv",
        });
    });

    it.each([
        null,
        "john 3:16",
        { book: "John", chapter: 3, verse: 16 },
        { book: "john/../x", chapter: 3, verse: 16 },
        { book: "john", chapter: "3", verse: 16 },
        { book: "john", chapter: 0, verse: 16 },
        { book: "john", chapter: 3, verse: 1.5 },
        { book: "john", chapter: 3, verse: 40000 },
        { book: "john", chapter: 3, verse: 16, translation: 7 },
    ])("rejects %j", (value) => {
        expect(parseVerseRef(value)).toBeNull();
    });
});

describe("isUuid", () => {
    it("accepts a uuid and rejects anything else", () => {
        expect(isUuid("0b9a1f7e-3c2d-4e5f-8a9b-0c1d2e3f4a5b")).toBe(true);
        expect(isUuid("1")).toBe(false);
        expect(isUuid("0b9a1f7e-3c2d-4e5f-8a9b-0c1d2e3f4a5b; drop")).toBe(
            false,
        );
    });
});

describe("compareCanonical", () => {
    it("orders by book, then chapter, then verse", () => {
        const refs = [
            { bookOrder: 43, chapterNumber: 3, verseNumber: 16 },
            { bookOrder: 1, chapterNumber: 1, verseNumber: 1 },
            { bookOrder: 43, chapterNumber: 1, verseNumber: 1 },
            { bookOrder: 43, chapterNumber: 3, verseNumber: 2 },
        ];
        expect(refs.sort(compareCanonical)).toEqual([
            { bookOrder: 1, chapterNumber: 1, verseNumber: 1 },
            { bookOrder: 43, chapterNumber: 1, verseNumber: 1 },
            { bookOrder: 43, chapterNumber: 3, verseNumber: 2 },
            { bookOrder: 43, chapterNumber: 3, verseNumber: 16 },
        ]);
    });
});
