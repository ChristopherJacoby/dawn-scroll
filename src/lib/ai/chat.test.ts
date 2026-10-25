import { describe, expect, it, vi } from "vitest";
import { CHAT_LIMITS, parseChatBody } from "./chat";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/bible/queries", () => ({}));
vi.mock("@/lib/bible/translation-preference", () => ({}));

const { passageVerses } = await import("./passage");

const user = (content: string) => ({ role: "user" as const, content });
const assistant = (content: string) => ({
    role: "assistant" as const,
    content,
});

describe("parseChatBody", () => {
    it("accepts a conversation ending in a question", () => {
        const result = parseChatBody(
            {
                messages: [
                    user("Who was Pilate?"),
                    assistant("A prefect."),
                    user("When?"),
                ],
            },
            12,
        );
        expect(result).toEqual({
            ok: true,
            turns: [
                user("Who was Pilate?"),
                assistant("A prefect."),
                user("When?"),
            ],
            passage: null,
        });
    });

    it("rejects bodies without a final question", () => {
        expect(parseChatBody({}, 12).ok).toBe(false);
        expect(parseChatBody({ messages: [] }, 12).ok).toBe(false);
        expect(
            parseChatBody({ messages: [user("Hi"), assistant("Hello")] }, 12)
                .ok,
        ).toBe(false);
        expect(parseChatBody({ messages: [user("   ")] }, 12).ok).toBe(false);
        expect(
            parseChatBody({ messages: [{ role: "system", content: "x" }] }, 12)
                .ok,
        ).toBe(false);
        expect(
            parseChatBody({ messages: [{ role: "user", content: 5 }] }, 12).ok,
        ).toBe(false);
    });

    it("rejects overlong questions", () => {
        const result = parseChatBody(
            { messages: [user("x".repeat(CHAT_LIMITS.questionChars + 1))] },
            12,
        );
        expect(result.ok).toBe(false);
    });

    it("drops empty replies left by a stopped answer", () => {
        const result = parseChatBody(
            { messages: [user("A"), assistant(""), user("B")] },
            12,
        );
        expect(result.ok && result.turns).toEqual([user("A"), user("B")]);
    });

    it("keeps the recent history, starting on a user turn", () => {
        const messages = [
            user("1"),
            assistant("2"),
            user("3"),
            assistant("4"),
            user("5"),
        ];
        const result = parseChatBody({ messages }, 4);
        expect(result.ok && result.turns).toEqual([
            user("3"),
            assistant("4"),
            user("5"),
        ]);
    });

    it("drops the oldest turns when the history is too long", () => {
        const long = "x".repeat(CHAT_LIMITS.totalChars - 10);
        const messages = [
            user("old"),
            assistant(long),
            user("mid"),
            assistant("ok"),
            user("new"),
        ];
        const result = parseChatBody({ messages }, 12);
        expect(result.ok && result.turns).toEqual([
            user("mid"),
            assistant("ok"),
            user("new"),
        ]);
    });

    it("validates the passage", () => {
        const messages = [user("What does this mean?")];
        const ok = parseChatBody(
            { messages, passage: { book: "john", chapter: 3, verse: 16 } },
            12,
        );
        expect(ok.ok && ok.passage).toEqual({
            book: "john",
            chapter: 3,
            verse: 16,
        });
        expect(
            parseChatBody(
                { messages, passage: { book: "John 3", chapter: 3 } },
                12,
            ).ok,
        ).toBe(false);
        expect(
            parseChatBody(
                { messages, passage: { book: "john", chapter: 0 } },
                12,
            ).ok,
        ).toBe(false);
    });
});

describe("passageVerses", () => {
    const verses = (count: number, length: number) =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            translationId: 1,
            bookId: 1,
            chapterNumber: 1,
            verseNumber: i + 1,
            text: "x".repeat(length),
        }));

    it("sends a whole chapter that fits", () => {
        expect(passageVerses(verses(36, 100))).toHaveLength(36);
    });

    it("sends a window around the selected verse of a long chapter", () => {
        const window = passageVerses(verses(176, 200), 100);
        expect(window[0].verseNumber).toBeLessThanOrEqual(100);
        expect(window.at(-1)!.verseNumber).toBeGreaterThanOrEqual(100);
        expect(
            window.reduce((sum, v) => sum + v.text.length, 0),
        ).toBeLessThanOrEqual(8000);
    });

    it("starts a long chapter at the top when no verse is selected", () => {
        expect(passageVerses(verses(176, 200))[0].verseNumber).toBe(1);
    });
});
