/** Roots: where Christian traditions came from. */

import type { FindingScriptureRef } from "@/lib/archaeology/types";

/**
 * How well the evidence supports a popular claim, strongest first. See
 * CLAIM_RATINGS in ./ratings.ts for what each level means.
 */
export type ClaimRating =
    | "established"
    | "supported"
    | "debated"
    | "unverified"
    | "contradicted";

/** What the browse page and API list need. */
export interface TraditionSummary {
    slug: string;
    name: string;
    summary: string;
}

export interface TraditionClaim {
    claim: string;
    rating: ClaimRating;
    /** May cite sources inline as [n]. */
    explanation: string;
}

/** A passage the tradition bears on, with what it says. */
export interface TraditionScriptureRef extends FindingScriptureRef {
    note: string;
}

/** A tradition with everything its detail page shows. */
export interface Tradition extends TraditionSummary {
    /** Paragraphs, in order; may cite sources inline as [n]. */
    origin: string[];
    /** What the sources show for AD 30–100; may cite as [n]. */
    earlyChurch: string[];
    claims: TraditionClaim[];
    /** `year` sorts (negative = BC); `label` is displayed. */
    timeline: { year: number; label: string; event: string }[];
    refs: TraditionScriptureRef[];
    /** In citation order: [n] is sources[n - 1]. */
    sources: { citation: string; url: string | null }[];
    /** When the content was last checked (YYYY-MM-DD). */
    reviewedOn: string;
}
