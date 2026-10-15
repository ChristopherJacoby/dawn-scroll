import type { CredibilityRating } from "./types";

/** Ratings from strongest to weakest, with what each one means. */
export const CREDIBILITY: Record<
    CredibilityRating,
    { label: string; description: string }
> = {
    established: {
        label: "Established",
        description:
            "Excavated, published and broadly accepted by scholars, with a direct link to the biblical text.",
    },
    supported: {
        label: "Supported",
        description:
            "Strong evidence, but its link to the biblical text is probable rather than certain.",
    },
    debated: {
        label: "Debated",
        description:
            "Real evidence, but scholars disagree about its date or its connection to the biblical account.",
    },
    unverified: {
        label: "Unverified",
        description:
            "Claims without recovered, published or independently examined evidence.",
    },
};

export const CREDIBILITY_ORDER = Object.keys(
    CREDIBILITY,
) as CredibilityRating[];

export function isCredibilityRating(
    value: unknown,
): value is CredibilityRating {
    return typeof value === "string" && Object.hasOwn(CREDIBILITY, value);
}
