/** Hard Questions: arguments from design and cosmology, with critiques. */

import type { ClaimRating } from "@/lib/roots/types";

export type QuestionCategory = "life" | "universe";

/** What the browse page and API list need. */
export interface QuestionSummary {
    slug: string;
    title: string;
    category: QuestionCategory;
    summary: string;
}

export interface QuestionClaim {
    claim: string;
    rating: ClaimRating;
    /** May cite sources inline as [n]. */
    explanation: string;
}

/** A short quote from one of the question's sources. */
export interface QuestionQuote {
    quote: string;
    speaker: string;
    role: string;
    /** 1-based position in `sources`. */
    source: number;
}

/** A question with everything its detail page shows. */
export interface Question extends QuestionSummary {
    /** Paragraphs, in order; each may cite sources inline as [n]. */
    argument: string[];
    critiques: string[];
    standing: string[];
    claims: QuestionClaim[];
    quotes: QuestionQuote[];
    related: QuestionSummary[];
    /** In citation order: [n] is sources[n - 1]. */
    sources: { citation: string; url: string | null }[];
    /** When the content was last checked (YYYY-MM-DD). */
    reviewedOn: string;
}
