import type { ClaimRating } from "@/lib/roots/types";
import type { QuestionCategory } from "./types";

/**
 * The Roots rating scale, worded for scientific and philosophical claims.
 * Philosophical inferences, which no experiment settles, are rated
 * "debated" at most.
 */
export const QUESTION_RATINGS: Record<
    ClaimRating,
    { label: string; description: string }
> = {
    established: {
        label: "Established",
        description:
            "Published evidence, accepted by researchers in the relevant field.",
    },
    supported: {
        label: "Supported",
        description:
            "Good published evidence, though some details remain uncertain.",
    },
    debated: {
        label: "Debated",
        description:
            "Credentialed researchers actively disagree. Philosophical inferences, which no experiment can settle, are rated debated at most.",
    },
    unverified: {
        label: "Unverified",
        description: "Proposed, but not yet tested or confirmed.",
    },
    contradicted: {
        label: "Contradicted",
        description: "The published evidence points the other way.",
    },
};

export const QUESTION_CATEGORIES: Record<QuestionCategory, string> = {
    life: "Life and biology",
    universe: "The universe",
};
