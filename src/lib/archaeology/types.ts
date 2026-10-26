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

/** A photo of a finding, with the attribution its license requires. */
export interface FindingImage {
    url: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
    credit: string;
    license: string;
    licenseUrl: string | null;
    /** Where the image came from (e.g. its Wikimedia Commons page). */
    sourceUrl: string;
}

/** A YouTube video about a finding, credited to whoever made it. */
export interface FindingVideo {
    youtubeId: string;
    title: string;
    channel: string;
    /** What it shows and whose view it presents. */
    note: string;
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
    /** The lead photo, if any. */
    image: FindingImage | null;
}

/** A finding with everything its detail page shows. */
export interface Finding extends FindingSummary {
    /** Paragraphs, in order. */
    description: string[];
    credibilityNote: string;
    sources: FindingSource[];
    timeline: FindingTimeline[];
    /** When the content was last checked (YYYY-MM-DD). */
    reviewedOn: string;
    /** All photos, lead photo first. */
    images: FindingImage[];
    videos: FindingVideo[];
}
