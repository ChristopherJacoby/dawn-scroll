import { describe, expect, it } from "vitest";
import {
    allows,
    FREE_FEATURES,
    isActiveSubscription,
    isPremiumFeature,
    PREMIUM_FEATURES,
} from "./features";
import { annualSavings, isPlanKey } from "./plans";

describe("feature matrix", () => {
    it("splits every feature into exactly one tier", () => {
        expect(PREMIUM_FEATURES).toContain("apostleMode");
        expect(PREMIUM_FEATURES).toContain("archaeologyHub");
        expect(FREE_FEATURES).toContain("reader");
        expect(
            FREE_FEATURES.filter((f) => PREMIUM_FEATURES.includes(f)),
        ).toEqual([]);
        expect(isPremiumFeature("scholarUnlimited")).toBe(true);
        expect(isPremiumFeature("hardQuestions")).toBe(false);
    });
});

describe("allows", () => {
    it("never blocks while Premium is off, and never blocks free features", () => {
        const off = { premiumEnabled: false, isPremium: false };
        const free = { premiumEnabled: true, isPremium: false };
        const paid = { premiumEnabled: true, isPremium: true };
        expect(allows("apostleMode", off)).toBe(true);
        expect(allows("reader", free)).toBe(true);
        expect(allows("apostleMode", free)).toBe(false);
        expect(allows("apostleMode", paid)).toBe(true);
    });
});

describe("isActiveSubscription", () => {
    const now = new Date("2026-10-25T12:00:00Z");
    it("grants access to active and trialing subscriptions in their period", () => {
        expect(
            isActiveSubscription("active", "2026-11-25T00:00:00Z", now),
        ).toBe(true);
        expect(
            isActiveSubscription("trialing", "2026-11-01T00:00:00Z", now),
        ).toBe(true);
    });
    it("fails closed without a period end", () => {
        expect(isActiveSubscription("active", null, now)).toBe(false);
    });
    it("denies lapsed periods and other statuses", () => {
        expect(
            isActiveSubscription("active", "2026-10-01T00:00:00Z", now),
        ).toBe(false);
        for (const status of [
            "none",
            "past_due",
            "canceled",
            "unpaid",
            "incomplete",
        ]) {
            expect(
                isActiveSubscription(status, "2026-11-25T00:00:00Z", now),
            ).toBe(false);
        }
    });
});

describe("plans", () => {
    it("validates plan keys and computes the annual saving", () => {
        expect(isPlanKey("annual")).toBe(true);
        expect(isPlanKey("weekly")).toBe(false);
        const { perMonth, percent } = annualSavings();
        expect(perMonth).toBeCloseTo(5.42, 2);
        expect(percent).toBe(32);
    });
});
