/** Verse-level layout facts, as getChapterLayout returns them. */
export interface LayoutMarks {
    paragraphStarts: number[];
    poetry: number[];
    stanzaStarts: number[];
}

export interface VerseBlock<V> {
    /** Prose verses run together; poetry verses are one line each. */
    kind: "prose" | "poetry";
    verses: V[];
}

/**
 * Group a chapter's verses into prose paragraphs and poetry stanzas. A
 * block ends where the next verse opens a paragraph or stanza, or turns
 * from prose to poetry or back.
 */
export function groupVerses<V extends { number: number }>(
    verses: V[],
    marks: LayoutMarks,
): VerseBlock<V>[] {
    const paragraphStarts = new Set(marks.paragraphStarts);
    const poetry = new Set(marks.poetry);
    const stanzaStarts = new Set(marks.stanzaStarts);
    const blocks: VerseBlock<V>[] = [];
    for (const verse of verses) {
        const kind = poetry.has(verse.number) ? "poetry" : "prose";
        const last = blocks.at(-1);
        const breaks =
            paragraphStarts.has(verse.number) || stanzaStarts.has(verse.number);
        if (last && last.kind === kind && !breaks) last.verses.push(verse);
        else blocks.push({ kind, verses: [verse] });
    }
    return blocks;
}
