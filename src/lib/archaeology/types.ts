/** Archaeological findings: the catalog shown in the reader and the hub. */

/**
 * How well a finding is supported, from strongest to weakest. See
 * CREDIBILITY in ./credibility.ts for what each level means.
 */
export type CredibilityRating =
    | "established"
    | "supported"
    | "debated"
    | "unverified";

/** A passage a finding bears on: a verse range, possibly across chapters. */
export interface FindingScriptureRef {
    bookSlug: string;
    bookName: string;
    chapterStart: number;
    verseStart: number;
    chapterEnd: number;
    verseEnd: number;
}

export interface FindingSource {
    citation: string;
    url: string | null;
}

/** A dated event; `year` sorts (negative = BC), `label` is displayed. */
export interface FindingTimeline {
    year: number;
    label: string;
    event: string;
}

/** What cards and the in-reader trigger need. */
export interface FindingSummary {
    slug: string;
    title: string;
    summary: string;
    siteName: string;
    location: { lat: number; lng: number };
    credibility: CredibilityRating;
    refs: FindingScriptureRef[];
}

/** A finding with everything its detail page shows. */
export interface Finding extends FindingSummary {
    /** Paragraphs, in order. */
    description: string[];
    credibilityNote: string;
    sources: FindingSource[];
    timeline: FindingTimeline[];
}
