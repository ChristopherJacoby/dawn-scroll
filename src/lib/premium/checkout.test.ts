import { describe, expect, it } from "vitest";
import { checkoutSessionParams } from "./checkout";

describe("checkoutSessionParams", () => {
    const base = {
        customerId: "cus_123",
        priceId: "price_123",
        userId: "user-1",
        origin: "https://www.dawnscroll.com",
    };

    it("builds a subscription checkout tied to the user", () => {
        const params = checkoutSessionParams({ ...base, offerTrial: true });
        expect(params.mode).toBe("subscription");
        expect(params.customer).toBe("cus_123");
        expect(params.client_reference_id).toBe("user-1");
        expect(params.line_items).toEqual([
            { price: "price_123", quantity: 1 },
        ]);
        expect(params.subscription_data?.trial_period_days).toBe(7);
        expect(params.subscription_data?.metadata).toEqual({
            user_id: "user-1",
        });
        expect(params.success_url).toBe(
            "https://www.dawnscroll.com/account/subscription?checkout=success",
        );
        expect(params.cancel_url).toBe(
            "https://www.dawnscroll.com/pricing?checkout=canceled",
        );
    });

    it("offers no trial to returning subscribers", () => {
        const params = checkoutSessionParams({ ...base, offerTrial: false });
        expect(params.subscription_data).not.toHaveProperty(
            "trial_period_days",
        );
    });
});
