import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH, parseNoteContent } from "./note-content";

describe("parseNoteContent", () => {
    it("keeps text as typed", () => {
        expect(parseNoteContent("  Grace\n")).toBe("  Grace\n");
    });
    it("treats whitespace-only as blank", () => {
        expect(parseNoteContent(" \n\t")).toBe("");
        expect(parseNoteContent("")).toBe("");
    });
    it("rejects non-strings and over-long text", () => {
        expect(parseNoteContent(5)).toBeNull();
        expect(parseNoteContent(undefined)).toBeNull();
        expect(parseNoteContent("x".repeat(NOTE_MAX_LENGTH + 1))).toBeNull();
        expect(parseNoteContent("x".repeat(NOTE_MAX_LENGTH))).toHaveLength(
            NOTE_MAX_LENGTH,
        );
    });
});
