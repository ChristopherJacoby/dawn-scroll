/**
 * What's free and what's premium. Everything is free until Premium is
 * switched on (PREMIUM_ENABLED=true), which should happen only once Stripe
 * checkout and webhooks are live; until then no gate ever blocks anyone.
 */

export const FEATURES = {
    reader: {
        label: "The Bible in every public-domain translation",
        tier: "free",
    },
    wordStudy: { label: "Hebrew and Greek word study", tier: "free" },
    archaeologyInline: {
        label: "Archaeology notes in the reader",
        tier: "free",
    },
    roots: { label: "Roots: where traditions came from", tier: "free" },
    hardQuestions: { label: "Hard Questions", tier: "free" },
    personalTools: {
        label: "Bookmarks, highlights, notes and reading plans",
        tier: "free",
    },
    scholarChat: {
        label: "Scholar AI chat, a few questions a day",
        tier: "free",
    },
    archaeologyHub: {
        label: "The full archaeology hub: map, photos and timelines",
        tier: "premium",
    },
    apostleMode: {
        label: "Apostle mode: conversations with the twelve and Paul",
        tier: "premium",
    },
    scholarUnlimited: { label: "Unlimited Scholar AI chat", tier: "premium" },
} as const satisfies Record<
    string,
    { label: string; tier: "free" | "premium" }
>;

export type FeatureKey = keyof typeof FEATURES;

const keys = Object.keys(FEATURES) as FeatureKey[];
export const FREE_FEATURES = keys.filter((k) => FEATURES[k].tier === "free");
export const PREMIUM_FEATURES = keys.filter(
    (k) => FEATURES[k].tier === "premium",
);

export function isPremiumFeature(feature: FeatureKey): boolean {
    return FEATURES[feature].tier === "premium";
}

/**
 * Whether premium features are actually gated. Read on the server; the
 * subscription status API passes it to the client.
 */
export function isPremiumEnabled(): boolean {
    return process.env.PREMIUM_ENABLED === "true";
}

/**
 * The access rule: free features always; premium ones only for premium
 * members, unless Premium is switched off, in which case everyone.
 */
export function allows(
    feature: FeatureKey,
    access: { premiumEnabled: boolean; isPremium: boolean },
): boolean {
    return (
        !isPremiumFeature(feature) || !access.premiumEnabled || access.isPremium
    );
}

/** Stripe statuses that grant access, while the paid period lasts. */
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/** Fails closed: without a known period end, a subscription grants nothing. */
export function isActiveSubscription(
    status: string,
    currentPeriodEnd: string | null,
    now: Date = new Date(),
): boolean {
    if (!ACTIVE_STATUSES.has(status) || currentPeriodEnd === null) return false;
    return new Date(currentPeriodEnd) > now;
}
