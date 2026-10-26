import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getChapterJourneys } = await import("./journeys");
const { journeys } = (await import("./journeys.json")).default as unknown as {
    journeys: import("./journeys").Journey[];
};

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

    it("marks the first stop on any route of a disputed journey", () => {
        expect(markers("exodus", 12)).toEqual([["exodus", 37]]);
        // Pi-hahiroth, on both routes.
        expect(markers("exodus", 14)).toEqual([["exodus", 2]]);
        // Marah, only on the Sinai Peninsula route.
        expect(markers("exodus", 15)).toEqual([["exodus", 23]]);
        expect(markers("exodus", 19)).toEqual([["exodus", 2]]);
    });

    it("skips chapters inside a journey that name no stop", () => {
        expect(markers("exodus", 13)).toEqual([]);
        expect(markers("exodus", 18)).toEqual([]);
    });

    it("returns nothing for chapters without a journey", () => {
        expect(markers("matthew", 3)).toEqual([]);
        expect(markers("psalms", 23)).toEqual([]);
    });
});

describe("journey routes", () => {
    it("gives every journey a route with a leg per stop after the first", () => {
        for (const journey of journeys) {
            expect(journey.routes.length).toBeGreaterThan(0);
            for (const route of journey.routes) {
                const stops = route.points.filter((p) => !("via" in p));
                expect(route.legs).toHaveLength(stops.length - 1);
            }
        }
    });

    it("labels each route of the disputed Exodus", () => {
        const exodus = journeys.find((j) => j.slug === "exodus")!;
        expect(exodus.routes.map((r) => r.label)).toEqual([
            "Sinai Peninsula",
            "Arabia",
        ]);
        expect(exodus.routes.every((r) => r.note && r.finding)).toBe(true);
    });
});
