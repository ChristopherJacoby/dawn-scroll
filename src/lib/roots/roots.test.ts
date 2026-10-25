import { describe, expect, it } from "vitest";
import { citedSources, splitCitations } from "./citations";

describe("splitCitations", () => {
    it("separates text runs from [n] markers, in order", () => {
        expect(
            splitCitations("Bede wrote in 725 [1][4]. German Ostern [2]"),
        ).toEqual([
            { text: "Bede wrote in 725 " },
            { cite: 1 },
            { cite: 4 },
            { text: ". German Ostern " },
            { cite: 2 },
        ]);
    });

    it("leaves prose without markers, and other brackets, alone", () => {
        expect(splitCitations("Jehovah [is] my shepherd")).toEqual([
            { text: "Jehovah [is] my shepherd" },
        ]);
        expect(splitCitations("")).toEqual([]);
    });
});

describe("citedSources", () => {
    it("lists each cited source once, in order of first citation", () => {
        expect(citedSources("a [3] b [1] c [3]\nd [2]")).toEqual([3, 1, 2]);
    });
});
