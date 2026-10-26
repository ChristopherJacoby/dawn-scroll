/**
 * Parsing and checks for eBible.org's verse-per-line (VPL) Bible texts,
 * shared by the translation import (scripts/import-translations.mjs) and
 * its tests. A VPL line is `<BOOK> <chapter>:<verse> <text>`, e.g.
 * `JOH 3:16 For God so loved the world…`; a verse the edition omits is a
 * line with no text.
 */

export interface VplVerse {
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface VplParseResult {
    verses: VplVerse[];
    /** `book.chapter.verse` keys of lines with no text. */
    blank: string[];
    errors: string[];
}

export const verseKey = (book: string, chapter: number, verse: number) =>
    `${book}.${chapter}.${verse}`;

/**
 * Collapse whitespace and normalize to NFC. No-break spaces are kept: the
 * WEB uses them between nested closing quotes so `’ ”` never wraps apart.
 */
export function normalizeVerseText(text: string): string {
    return text
        .normalize("NFC")
        .replace(/[^\S\u00a0]+/g, " ")
        .trim();
}

/**
 * Parse VPL text, mapping each source book code to our book slug. Unknown
 * codes, malformed lines and duplicate references are reported as errors.
 */
export function parseVpl(
    raw: string,
    bookByCode: ReadonlyMap<string, string>,
): VplParseResult {
    const verses: VplVerse[] = [];
    const blank: string[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();
    const lines = raw.replace(/^﻿/, "").split(/\r?\n/);
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        const match = /^(\S+) (\d+):(\d+)(?: (.*))?$/.exec(line);
        if (!match) {
            errors.push(`Line ${index + 1} is not "BOOK c:v text"`);
            return;
        }
        const book = bookByCode.get(match[1]);
        if (!book) {
            errors.push(`Line ${index + 1} has unknown book code ${match[1]}`);
            return;
        }
        const chapter = Number(match[2]);
        const verse = Number(match[3]);
        const key = verseKey(book, chapter, verse);
        if (seen.has(key)) errors.push(`Duplicate verse ${key}`);
        seen.add(key);
        const text = normalizeVerseText(match[4] ?? "");
        if (text) verses.push({ book, chapter, verse, text });
        else blank.push(key);
    });
    return { verses, blank, errors };
}

/**
 * Characters that never appear in these plain texts, so their presence
 * means leftover markup (USFM backslashes, XML tags, footnote callers).
 * Square brackets are deliberately allowed: the ASV and YLT use them for
 * supplied words, and the ASV for "[Selah" and John 7:53–8:11.
 */
const MARKUP = /[<>{}\\|*_~^]|\p{Cc}/u;

export function findMarkup(verses: readonly VplVerse[]): string[] {
    return verses
        .filter((v) => MARKUP.test(v.text))
        .map((v) => verseKey(v.book, v.chapter, v.verse));
}

/** Keys in `actual` but not `expected` (extra), and the reverse (missing). */
export function compareVerseKeys(
    expected: ReadonlySet<string>,
    actual: ReadonlySet<string>,
): { extra: string[]; missing: string[] } {
    return {
        extra: [...actual].filter((key) => !expected.has(key)),
        missing: [...expected].filter((key) => !actual.has(key)),
    };
}

const LETTERS = "A-Za-zÁÉÍÓÚÑÜáéíóúñü";
const WORD = new RegExp(`[${LETTERS}]+`, "g");
const UPPER_WORD = /^[A-ZÁÉÍÓÚÑÜ]{2,}$/;
// A word preceded by a lowercase letter or a comma and a space is mid-
// sentence, so its case there is its real case.
const MID_SENTENCE = new RegExp(`(?<=[a-záéíóúñü,;] )[${LETTERS}]+`, "g");

/** Whether the word at `offset` opens a sentence (or the verse). */
function opensSentence(text: string, offset: number): boolean {
    const before = text.slice(0, offset).replace(/[\s¡¿«"“]+$/, "");
    return before === "" || /[.:;!?]$/.test(before);
}

/**
 * Some editions print each chapter's opening words in capitals, as the
 * printed page's drop cap does: "EN el principio", "Y MOISÉS dijo", or
 * after a psalm's title, "Salmo de David. RESPÓNDEME cuando clamo".
 * Restore those words to the case they have mid-sentence elsewhere in the
 * text, so names stay capitalized ("Moisés"), words always set in capitals
 * stay that way ("JAH"), and the rest are lowercased, with the run's
 * first letter capitalized. Only verse 1 of each chapter is touched, and
 * only the first run of capitals that opens a sentence.
 */
export function restoreChapterOpenings(verses: VplVerse[]): VplVerse[] {
    const forms = new Map<string, Map<string, number>>();
    for (const { text } of verses) {
        for (const [word] of text.matchAll(MID_SENTENCE)) {
            const key = word.toLowerCase();
            const counts = forms.get(key) ?? new Map<string, number>();
            counts.set(word, (counts.get(word) ?? 0) + 1);
            forms.set(key, counts);
        }
    }
    const usualForm = (word: string) => {
        const counts = forms.get(word.toLowerCase());
        if (!counts) return word.toLowerCase();
        return [...counts].sort((a, b) => b[1] - a[1])[0][0];
    };
    const capitalize = (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1);

    return verses.map((verse) => {
        if (verse.verse !== 1) return verse;
        let state: "before" | "starting" | "in" | "done" = "before";
        const text = verse.text.replace(WORD, (word, offset: number) => {
            if (state === "done") return word;
            const upper = UPPER_WORD.test(word);
            if (state === "before") {
                if (!opensSentence(verse.text, offset)) return word;
                // A one-letter opener ("Y", "Á") may begin the run.
                if (word.length === 1 && word === word.toUpperCase()) {
                    state = "starting";
                    return word;
                }
                if (!upper) return word;
                state = "in";
                return capitalize(usualForm(word));
            }
            if (word.length === 1) return word;
            if (!upper) {
                state = state === "starting" ? "before" : "done";
                return word;
            }
            state = "in";
            return usualForm(word);
        });
        return text === verse.text ? verse : { ...verse, text };
    });
}
