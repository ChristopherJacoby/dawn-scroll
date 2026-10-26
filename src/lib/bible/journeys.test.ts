import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getChapterJourneys } = await import("./journeys");

const markers = (book: string, chapter: number) =>
    getChapterJourneys(book, chapter).map(({ verse, journey }) => [
        journey.slug,
        verse,
    ]);

describe("getChapterJourneys", () => {
    it("marks the passage's first verse in its first chapter", () => {
        expect(markers("luke", 2)).toEqual([["nazareth-to-bethlehem", 1]]);
        expect(markers("acts", 13)).toEqual([["paul-first-journey", 1]]);
    });

    it("marks the first stop named in each later chapter", () => {
        expect(markers("acts", 14)).toEqual([["paul-first-journey", 8]]);
        expect(markers("acts", 28)).toEqual([["paul-voyage-to-rome", 1]]);
    });

    it("marks every journey in a chapter where one ends and another begins", () => {
        expect(markers("acts", 18)).toEqual([
            ["paul-second-journey", 1],
            ["paul-third-journey", 23],
        ]);
    });

    it("ignores stops outside the passage", () => {
        // The voyage starts from Caesarea, named in Acts 25:4.
        expect(markers("acts", 25)).toEqual([]);
    });

    it("returns nothing for chapters without a journey", () => {
        expect(markers("matthew", 3)).toEqual([]);
        expect(markers("psalms", 23)).toEqual([]);
    });
});
