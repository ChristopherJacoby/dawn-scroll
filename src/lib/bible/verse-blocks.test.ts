import { describe, expect, it } from "vitest";
import { groupVerses } from "./verse-blocks";

const verses = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ number: from + i }));
const shape = (blocks: ReturnType<typeof groupVerses>) =>
    blocks.map((b) => `${b.kind}:${b.verses.map((v) => v.number).join(",")}`);

describe("groupVerses", () => {
    it("runs prose verses together until a paragraph starts", () => {
        expect(
            shape(
                groupVerses(verses(1, 6), {
                    paragraphStarts: [1, 4],
                    poetry: [],
                    stanzaStarts: [],
                }),
            ),
        ).toEqual(["prose:1,2,3", "prose:4,5,6"]);
    });

    it("splits poetry into stanzas and back to prose", () => {
        expect(
            shape(
                groupVerses(verses(1, 7), {
                    paragraphStarts: [1, 3],
                    poetry: [3, 4, 5, 6],
                    stanzaStarts: [5],
                }),
            ),
        ).toEqual(["prose:1,2", "poetry:3,4", "poetry:5,6", "prose:7"]);
    });

    it("starts a block at the first verse even without a mark", () => {
        expect(
            shape(
                groupVerses(verses(1, 2), {
                    paragraphStarts: [],
                    poetry: [],
                    stanzaStarts: [],
                }),
            ),
        ).toEqual(["prose:1,2"]);
    });
});
