import "server-only";
import { getChapter } from "@/lib/bible/queries";
import { chapterReference } from "@/lib/bible/references";
import { getPreferredTranslation } from "@/lib/bible/translation-preference";
import type { Verse } from "@/lib/bible/types";
import type { PassageRef } from "./chat";

/** About 2,000 tokens: whole chapters except the longest. */
const MAX_PASSAGE_CHARS = 8000;
/** Verses either side of the selected one when a chapter is too long. */
const WINDOW = 15;

/** The verses to send: the whole chapter, or a window that fits. */
export function passageVerses(verses: Verse[], selected?: number): Verse[] {
    const length = (list: Verse[]) =>
        list.reduce((sum, v) => sum + v.text.length + 5, 0);
    if (length(verses) <= MAX_PASSAGE_CHARS) return verses;
    const index = selected
        ? Math.max(
              0,
              verses.findIndex((v) => v.verseNumber === selected),
          )
        : 0;
    let window = verses.slice(Math.max(0, index - WINDOW), index + WINDOW + 1);
    while (length(window) > MAX_PASSAGE_CHARS && window.length > 1) {
        // Trim whichever end is farther from the selected verse.
        const first = window[0].verseNumber;
        const last = window.at(-1)!.verseNumber;
        const anchor = verses[index].verseNumber;
        window =
            anchor - first > last - anchor
                ? window.slice(1)
                : window.slice(0, -1);
    }
    return window;
}

/**
 * Context naming the passage the reader has open, with its text in their
 * translation. Null when the passage doesn't exist.
 */
export async function passageContext(
    passage: PassageRef,
): Promise<string | null> {
    const translation = await getPreferredTranslation();
    if (!translation) return null;
    const chapter = await getChapter(
        passage.book,
        passage.chapter,
        translation,
    );
    if (!chapter || chapter.verses.length === 0) return null;
    const verse = chapter.verses.some((v) => v.verseNumber === passage.verse)
        ? passage.verse
        : undefined;
    const reference = chapterReference(chapter.book.name, passage.chapter);
    const verses = passageVerses(chapter.verses, verse);
    const excerpt =
        verses.length < chapter.verses.length
            ? ` (verses ${verses[0].verseNumber}-${verses.at(-1)!.verseNumber} of the chapter)`
            : "";
    const selected = verse ? `, and has verse ${verse} selected` : "";
    const text = verses.map((v) => `${v.verseNumber} ${v.text}`).join("\n");
    return `The reader is reading ${reference} in the ${translation.abbreviation}${selected}. Its text${excerpt}:\n\n<passage reference="${reference}">\n${text}\n</passage>`;
}
