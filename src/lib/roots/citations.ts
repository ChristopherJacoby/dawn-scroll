/**
 * Inline citations in Roots prose: `[n]` cites the tradition's nth source
 * (1-based). Shared by the seed generator (scripts/generate-roots-seed.mjs),
 * which checks every marker resolves, and the detail page, which links
 * them to the source list.
 */

export type ProseSegment = { text: string } | { cite: number };

const MARKER = /\[(\d+)\]/g;

/** Split prose into text runs and citation markers, in order. */
export function splitCitations(prose: string): ProseSegment[] {
    const segments: ProseSegment[] = [];
    let last = 0;
    for (const match of prose.matchAll(MARKER)) {
        if (match.index > last) {
            segments.push({ text: prose.slice(last, match.index) });
        }
        segments.push({ cite: Number(match[1]) });
        last = match.index + match[0].length;
    }
    if (last < prose.length) segments.push({ text: prose.slice(last) });
    return segments;
}

/** Source numbers cited in the prose, in order of first appearance. */
export function citedSources(prose: string): number[] {
    return [
        ...new Set(
            splitCitations(prose).flatMap((s) => ("cite" in s ? [s.cite] : [])),
        ),
    ];
}
