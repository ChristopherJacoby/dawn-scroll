import { describe, expect, it } from "vitest";
import { compareVerseKeys, findMarkup, parseVpl } from "./vpl";

const BOOKS = new Map([
    ["MAT", "matthew"],
    ["JOH", "john"],
]);

describe("parseVpl", () => {
    it("parses verses, normalizes whitespace, and records blank lines", () => {
        const raw = [
            "﻿MAT 17:20 He said to them, “Because of your unbelief.",
            "MAT 17:21 ",
            "JOH 3:16 For God so loved the  world,",
            "",
        ].join("\r\n");
        const result = parseVpl(raw, BOOKS);
        expect(result.errors).toEqual([]);
        expect(result.blank).toEqual(["matthew.17.21"]);
        expect(result.verses).toEqual([
            {
                book: "matthew",
                chapter: 17,
                verse: 20,
                text: "He said to them, “Because of your unbelief.",
            },
            {
                book: "john",
                chapter: 3,
                verse: 16,
                text: "For God so loved the world,",
            },
        ]);
    });

    it("reports malformed lines, unknown books and duplicates", () => {
        const raw = [
            "JOH 3:16 For God",
            "JOH 3:16 again",
            "GEN 1:1 In the beginning",
            "JOH three:16 nope",
        ].join("\n");
        expect(parseVpl(raw, BOOKS).errors).toEqual([
            "Duplicate verse john.3.16",
            "Line 3 has unknown book code GEN",
            'Line 4 is not "BOOK c:v text"',
        ]);
    });
});

describe("findMarkup", () => {
    it("flags tags and USFM but allows supplied-word brackets", () => {
        const verse = (n: number, text: string) => ({
            book: "john",
            chapter: 1,
            verse: n,
            text,
        });
        expect(
            findMarkup([
                verse(1, "Jehovah [is] my shepherd. [Selah"),
                verse(2, "In the <i>beginning</i>"),
                verse(3, "the Word \\f + note\\f*"),
            ]),
        ).toEqual(["john.1.2", "john.1.3"]);
    });
});

describe("compareVerseKeys", () => {
    it("lists extra and missing references", () => {
        expect(
            compareVerseKeys(
                new Set(["romans.16.25", "romans.16.26"]),
                new Set(["romans.14.24", "romans.16.26"]),
            ),
        ).toEqual({ extra: ["romans.14.24"], missing: ["romans.16.25"] });
    });
});
