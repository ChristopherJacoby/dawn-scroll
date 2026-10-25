import type { ClaimRating } from "./types";

/**
 * Ratings for popular claims about a tradition, strongest first. Unlike
 * archaeology's scale, a claim can be contradicted by the evidence.
 */
export const CLAIM_RATINGS: Record<
    ClaimRating,
    { label: string; description: string }
> = {
    established: {
        label: "Established",
        description:
            "Documented in primary sources and accepted by historians.",
    },
    supported: {
        label: "Supported",
        description: "Good evidence, though some details remain uncertain.",
    },
    debated: {
        label: "Debated",
        description:
            "Historians disagree, and there is evidence on more than one side.",
    },
    unverified: {
        label: "Unverified",
        description:
            "No evidence beyond assertion or much later sources; it may be true, but it can’t be shown.",
    },
    contradicted: {
        label: "Contradicted",
        description: "The available evidence points the other way.",
    },
};

export const CLAIM_RATING_ORDER = Object.keys(CLAIM_RATINGS) as ClaimRating[];
