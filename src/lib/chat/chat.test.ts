import { describe, expect, it } from "vitest";
import { findVerseReferences } from "@/lib/bible/references";
import { parseInline, parseMarkdown } from "./markdown";
import { readNdjson } from "./ndjson";

const hrefs = (text: string) => findVerseReferences(text).map((r) => r.href);

describe("findVerseReferences", () => {
    it("links verses, ranges and chapters", () => {
        expect(hrefs("See John 3:16 and Leviticus 23:34-36.")).toEqual([
            "/read/john/3#verse-16",
            "/read/leviticus/23#verse-34",
        ]);
        expect(hrefs("Read Genesis 1 first.")).toEqual(["/read/genesis/1"]);
        expect(hrefs("John 3:16–4:2")).toEqual(["/read/john/3#verse-16"]);
    });

    it("prefers numbered and multi-word books", () => {
        expect(
            hrefs("1 John 4:8, Song of Solomon 2:1, Song of Songs 8:6"),
        ).toEqual([
            "/read/1-john/4#verse-8",
            "/read/song-of-solomon/2#verse-1",
            "/read/song-of-solomon/8#verse-6",
        ]);
        expect(hrefs("Psalm 23:1 and Psalms 119")).toEqual([
            "/read/psalms/23#verse-1",
            "/read/psalms/119",
        ]);
    });

    it("accepts abbreviations only with a verse", () => {
        expect(hrefs("Gen 1:1, Matt. 5:3, 1 Cor 13:4")).toEqual([
            "/read/genesis/1#verse-1",
            "/read/matthew/5#verse-3",
            "/read/1-corinthians/13#verse-4",
        ]);
        expect(hrefs("Gen 1")).toEqual([]);
    });

    it("reads one-chapter books' numbers as verses, and skips roman numerals", () => {
        expect(hrefs("Jude 3 and Philemon 1:10")).toEqual([
            "/read/jude/1#verse-3",
            "/read/philemon/1#verse-10",
        ]);
        expect(hrefs("I John 4:8")).toEqual([]);
    });

    it("skips chapters that don't exist and words that only look like books", () => {
        expect(hrefs("John 22:1, Johnson 3:1, 2 Johns 1")).toEqual([]);
    });
});

describe("parseInline", () => {
    it("parses emphasis, code and safe links", () => {
        expect(
            parseInline("**Bold** and *it* and `x` and [page](/roots/easter)"),
        ).toEqual([
            { type: "strong", children: [{ type: "text", text: "Bold" }] },
            { type: "text", text: " and " },
            { type: "em", children: [{ type: "text", text: "it" }] },
            { type: "text", text: " and " },
            { type: "code", text: "x" },
            { type: "text", text: " and " },
            {
                type: "link",
                href: "/roots/easter",
                children: [{ type: "text", text: "page" }],
            },
        ]);
    });

    it("leaves unsafe links and unfinished syntax as text", () => {
        expect(parseInline("[x](javascript:alert(1)) **open")).toEqual([
            { type: "text", text: "[x](javascript:alert(1)) **open" },
        ]);
        for (const href of [
            "//evil.example",
            "https://evil.example",
            "/account",
            "/read/../x",
        ]) {
            expect(parseInline(`[x](${href})`)).toEqual([
                { type: "text", text: `[x](${href})` },
            ]);
        }
    });

    it("links references inside text and emphasis", () => {
        expect(parseInline("Compare **John 1:1**.")).toEqual([
            { type: "text", text: "Compare " },
            {
                type: "strong",
                children: [
                    {
                        type: "verse",
                        href: "/read/john/1#verse-1",
                        text: "John 1:1",
                    },
                ],
            },
            { type: "text", text: "." },
        ]);
    });

    it("parses italics inside bold", () => {
        expect(parseInline("**The *mikveh* rite**")).toEqual([
            {
                type: "strong",
                children: [
                    { type: "text", text: "The " },
                    {
                        type: "em",
                        children: [{ type: "text", text: "mikveh" }],
                    },
                    { type: "text", text: " rite" },
                ],
            },
        ]);
    });

    it("doesn't treat snake_case or multiplication as italics", () => {
        expect(parseInline("a_b_c and 2 * 3 * 4")).toEqual([
            { type: "text", text: "a_b_c and 2 * 3 * 4" },
        ]);
    });
});

describe("parseMarkdown", () => {
    it("splits paragraphs, lists, quotes and headings", () => {
        const blocks = parseMarkdown(
            "Intro line\nsecond line\n\n- one\n- two\n\n1. first\n2. second\n\n> quoted\n> more\n\n## Title",
        );
        expect(blocks.map((b) => b.type)).toEqual([
            "paragraph",
            "list",
            "list",
            "quote",
            "heading",
        ]);
        expect(blocks[0]).toEqual({
            type: "paragraph",
            children: [{ type: "text", text: "Intro line\nsecond line" }],
        });
        expect(blocks[1]).toMatchObject({
            ordered: false,
            items: [[{ text: "one" }], [{ text: "two" }]],
        });
        expect(blocks[2]).toMatchObject({ ordered: true });
    });

    it("keeps numbered items separated by blank lines in one list", () => {
        const blocks = parseMarkdown(
            "1. Passover\n\n2. Pentecost\n\n3. Tabernacles",
        );
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toMatchObject({
            type: "list",
            ordered: true,
            start: 1,
        });
        expect(blocks[0].type === "list" && blocks[0].items).toHaveLength(3);
        expect(parseMarkdown("3. Third\n4. Fourth")[0]).toMatchObject({
            start: 3,
        });
    });

    it("ends a list at a following paragraph", () => {
        expect(parseMarkdown("- a\nThen text").map((b) => b.type)).toEqual([
            "list",
            "paragraph",
        ]);
    });
});

describe("readNdjson", () => {
    it("reassembles lines split across chunks", async () => {
        const chunks = ['{"a":1}\n{"b"', ":2}\n", '{"c":3}'];
        const body = new ReadableStream<Uint8Array>({
            start(controller) {
                for (const c of chunks)
                    controller.enqueue(new TextEncoder().encode(c));
                controller.close();
            },
        });
        const values = [];
        for await (const value of readNdjson(body)) values.push(value);
        expect(values).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    });
});
