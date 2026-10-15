import type { FindingScriptureRef, FindingSummary } from "./types";

/** "2 Kings 18:13–19:37", "Joshua 6:1–27", "Luke 3:1". */
export function formatScriptureRef(ref: FindingScriptureRef): string {
    const start = `${ref.bookName} ${ref.chapterStart}:${ref.verseStart}`;
    if (ref.chapterEnd !== ref.chapterStart) {
        return `${start}–${ref.chapterEnd}:${ref.verseEnd}`;
    }
    if (ref.verseEnd !== ref.verseStart) return `${start}–${ref.verseEnd}`;
    return start;
}

/** Reader URL for the start of a reference, scrolled to its first verse. */
export function scriptureRefHref(ref: FindingScriptureRef): string {
    return `/read/${ref.bookSlug}/${ref.chapterStart}#verse-${ref.verseStart}`;
}

/**
 * Does the reference cover any verse of this chapter? Gives the verse
 * range it covers within the chapter, or null.
 */
export function refRangeInChapter(
    ref: FindingScriptureRef,
    chapter: number,
): { first: number; last: number | null } | null {
    if (chapter < ref.chapterStart || chapter > ref.chapterEnd) return null;
    return {
        first: chapter === ref.chapterStart ? ref.verseStart : 1,
        // null: runs to the end of the chapter.
        last: chapter === ref.chapterEnd ? ref.verseEnd : null,
    };
}

/**
 * Where the reader shows each finding in a chapter: verse number → the
 * findings marked there. A finding is marked once, at the first verse of
 * its earliest reference in the chapter.
 */
export function findingMarkers(
    findings: FindingSummary[],
    bookSlug: string,
    chapter: number,
): Map<number, FindingSummary[]> {
    const markers = new Map<number, FindingSummary[]>();
    for (const finding of findings) {
        const firsts = finding.refs
            .filter((ref) => ref.bookSlug === bookSlug)
            .map((ref) => refRangeInChapter(ref, chapter)?.first)
            .filter((first) => first !== undefined);
        if (firsts.length === 0) continue;
        const verse = Math.min(...firsts);
        markers.set(verse, [...(markers.get(verse) ?? []), finding]);
    }
    return markers;
}
