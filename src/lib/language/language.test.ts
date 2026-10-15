import { describe, expect, it } from "vitest";
import { alignTokens } from "./align";
import { parseMorphologyExpansion, summarizeMorphology } from "./morphology";
import {
    displayStrongs,
    normalizeStrongs,
    normalizeToken,
    tokenizeVerse,
} from "./text";

describe("tokenizeVerse / normalizeToken", () => {
    it("splits on whitespace and keeps punctuation on tokens", () => {
        expect(tokenizeVerse("  In the beginning was the Word,  and ")).toEqual(
            ["In", "the", "beginning", "was", "the", "Word,", "and"],
        );
    });
    it("normalizes case, punctuation and curly apostrophes", () => {
        expect(normalizeToken("Word,")).toBe("word");
        expect(normalizeToken("man’s")).toBe("mans");
        expect(normalizeToken("LORD:")).toBe("lord");
    });
});

describe("normalizeStrongs", () => {
    it("pads to four digits and drops STEPBible suffixes", () => {
        expect(normalizeStrongs("G746")).toBe("G0746");
        expect(normalizeStrongs("g0746")).toBe("G0746");
        expect(normalizeStrongs("H3068G")).toBe("H3068");
        expect(normalizeStrongs("H7225")).toBe("H7225");
    });
    it("rejects non-Strong's values", () => {
        expect(normalizeStrongs("X12")).toBeNull();
        expect(normalizeStrongs("G12345")).toBeNull();
        expect(normalizeStrongs("")).toBeNull();
    });
    it("displays without padding", () => {
        expect(displayStrongs("G0746")).toBe("G746");
        expect(displayStrongs("H7225")).toBe("H7225");
    });
});

describe("alignTokens", () => {
    it("maps identical editions one-to-one", () => {
        const words = ["In", "the", "beginning"];
        expect(alignTokens(words, words)).toEqual([0, 1, 2]);
    });
    it("tolerates case, punctuation and inserted or dropped words", () => {
        const tagged = ["LORD,", "how", "are", "they", "much", "increased"];
        const ours = ["Lord,", "how", "are", "they", "now", "increased!"];
        expect(alignTokens(tagged, ours)).toEqual([0, 1, 2, 3, null, 5]);
    });
});

describe("morphology", () => {
    it("parses and summarizes an expansion", () => {
        const features = parseMorphologyExpansion(
            "Function=Verb ; Stem=Qal (hence Action=Simple; Voice=Active); Person=Third",
        );
        expect(features.map((f) => f.name)).toContain("Function");
        expect(summarizeMorphology(features.slice(0, 1))).toBe("Verb");
        expect(
            summarizeMorphology(
                parseMorphologyExpansion(
                    "Function=Noun; Case=Nominative; Number=Singular; Gender=Masculine",
                ),
            ),
        ).toBe("Noun · Nominative · Singular · Masculine");
    });
});
