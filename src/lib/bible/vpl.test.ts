import { describe, expect, it } from "vitest";
import {
    compareVerseKeys,
    findMarkup,
    parseVpl,
    restoreChapterOpenings,
} from "./vpl";

const BOOKS = new Map([
    ["MAT", "matthew"],
    ["JOH", "john"],
]);

describe("parseVpl", () => {
    it("parses verses, normalizes whitespace, and records blank lines", () => {
        const raw = [
            "\uFEFFMAT 17:20 He said to them, “Because of your unbelief.",
            "MAT 17:21 ",
            "JOH 3:16 For God so  loved the\tworld, ‘walk.’\u00a0”",
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
                text: "For God so loved the world, ‘walk.’\u00a0”",
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

describe("restoreChapterOpenings", () => {
    const verse = (chapter: number, n: number, text: string) => ({
        book: "genesis",
        chapter,
        verse: n,
        text,
    });
    const elsewhere = [
        verse(9, 2, "y dijo Moisés al pueblo, y habló JEHOVÁ en el monte"),
        verse(9, 3, "y fué así, y aconteció que Moisés subió al monte"),
    ];
    const fix = (text: string) =>
        restoreChapterOpenings([verse(1, 1, text), ...elsewhere])[0].text;

    it("lowercases the drop-cap words", () => {
        expect(fix("EN el principio crió Dios")).toBe(
            "En el principio crió Dios",
        );
        expect(fix("Y ACONTECIÓ después")).toBe("Y aconteció después");
        expect(fix("¡AY de los que")).toBe("¡Ay de los que");
    });

    it("finds the drop cap after a psalm's title", () => {
        expect(fix("Salmo de David. RESPÓNDEME cuando clamo")).toBe(
            "Salmo de David. Respóndeme cuando clamo",
        );
        expect(fix("Al Músico principal: Salmo de David. LOS cielos")).toBe(
            "Al Músico principal: Salmo de David. Los cielos",
        );
    });

    it("keeps names and words always set in capitals", () => {
        expect(fix("Y MOISÉS dijo")).toBe("Y Moisés dijo");
        expect(fix("Y JEHOVÁ habló")).toBe("Y JEHOVÁ habló");
    });

    it("leaves other verses alone", () => {
        const second = verse(1, 2, "MENE MENE TEKEL");
        expect(restoreChapterOpenings([second])[0]).toBe(second);
    });
});
