import { describe, expect, it } from "vitest";
import {
    chapterInDay,
    computeStreak,
    nextDay,
    readingChapters,
    readingLabel,
} from "./plan-progress";

describe("readingLabel", () => {
    it("shows a range or a single chapter", () => {
        const base = { bookSlug: "genesis", bookName: "Genesis" };
        expect(readingLabel({ ...base, startChapter: 1, endChapter: 3 })).toBe(
            "Genesis 1–3",
        );
        expect(readingLabel({ ...base, startChapter: 5, endChapter: 5 })).toBe(
            "Genesis 5",
        );
    });
});

describe("nextDay", () => {
    it("is the first incomplete day, even with gaps", () => {
        expect(nextDay([], 30)).toBe(1);
        expect(nextDay([1, 2, 4], 30)).toBe(3);
    });
    it("is null when every day is done", () => {
        expect(nextDay([1, 2, 3], 3)).toBeNull();
    });
});

describe("computeStreak", () => {
    const tz = "America/Chicago";
    // Noon Central on Oct 14, 2026.
    const now = new Date("2026-10-14T17:00:00Z");

    it("counts consecutive days ending today", () => {
        expect(
            computeStreak(
                [
                    "2026-10-14T15:00:00Z",
                    "2026-10-13T15:00:00Z",
                    "2026-10-12T15:00:00Z",
                    "2026-10-10T15:00:00Z",
                ],
                now,
                tz,
            ),
        ).toBe(3);
    });

    it("keeps yesterday's streak alive until today is missed", () => {
        expect(
            computeStreak(
                ["2026-10-13T15:00:00Z", "2026-10-12T15:00:00Z"],
                now,
                tz,
            ),
        ).toBe(2);
        expect(computeStreak(["2026-10-12T15:00:00Z"], now, tz)).toBe(0);
    });

    it("counts several readings on one day once", () => {
        expect(
            computeStreak(
                ["2026-10-14T13:00:00Z", "2026-10-14T16:00:00Z"],
                now,
                tz,
            ),
        ).toBe(1);
    });

    it("uses the reader's calendar day, not UTC", () => {
        // 9pm Central Oct 13 is already Oct 14 in UTC.
        expect(computeStreak(["2026-10-14T02:00:00Z"], now, tz)).toBe(1);
        expect(computeStreak(["2026-10-14T02:00:00Z"], now, "Asia/Tokyo")).toBe(
            1,
        );
    });

    it("is zero with no readings", () => {
        expect(computeStreak([], now, tz)).toBe(0);
    });
});

describe("chapterInDay", () => {
    const day = [
        {
            bookSlug: "psalms",
            bookName: "Psalms",
            startChapter: 1,
            endChapter: 2,
        },
        {
            bookSlug: "proverbs",
            bookName: "Proverbs",
            startChapter: 1,
            endChapter: 1,
        },
    ];

    it("lists the day's chapters in order", () => {
        expect(
            readingChapters(day).map((c) => `${c.bookSlug} ${c.chapter}`),
        ).toEqual(["psalms 1", "psalms 2", "proverbs 1"]);
    });

    it("finds a chapter and the next one in the day, across books", () => {
        expect(chapterInDay(day, "psalms", 2)).toEqual({
            index: 2,
            total: 3,
            next: { bookSlug: "proverbs", bookName: "Proverbs", chapter: 1 },
        });
    });

    it("marks the day's last chapter", () => {
        expect(chapterInDay(day, "proverbs", 1)).toEqual({
            index: 3,
            total: 3,
            next: null,
        });
    });

    it("returns null for chapters outside the day", () => {
        expect(chapterInDay(day, "psalms", 3)).toBeNull();
        expect(chapterInDay(day, "genesis", 1)).toBeNull();
    });
});
