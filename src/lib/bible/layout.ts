import "server-only";
import type { LayoutMarks } from "./verse-blocks";
import layout from "./verse-layout.json";

/**
 * Where a chapter's paragraphs, poetry lines and stanzas fall, from the
 * World English Bible (scripts/generate-verse-layout.mjs). Every
 * translation here shares the KJV's verse divisions, so one layout serves
 * them all.
 */
interface RawLayout {
    p: number[];
    q: [number, number][];
    b: number[];
}

// Ranges come out of JSON as number[][]; the generator writes pairs.
const BOOKS = layout as unknown as Record<string, Record<string, RawLayout>>;

export function getChapterLayout(
    bookSlug: string,
    chapter: number,
): LayoutMarks | null {
    const raw = BOOKS[bookSlug]?.[chapter];
    if (!raw) return null;
    return {
        paragraphStarts: raw.p,
        poetry: raw.q.flatMap(([from, to]) =>
            Array.from({ length: to - from + 1 }, (_, i) => from + i),
        ),
        stanzaStarts: raw.b,
    };
}
