/** Premium plans, as shown on the pricing page and in upgrade prompts. */

export type PlanKey = "monthly" | "annual";

export const PLANS: Record<
    PlanKey,
    { label: string; price: number; interval: "month" | "year" }
> = {
    monthly: { label: "Monthly", price: 7.99, interval: "month" },
    annual: { label: "Annual", price: 64.99, interval: "year" },
};

export const TRIAL_DAYS = 7;

export function isPlanKey(value: unknown): value is PlanKey {
    return value === "monthly" || value === "annual";
}

/** "$7.99" */
export function formatPrice(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

/** The annual plan's monthly equivalent and its saving over monthly. */
export function annualSavings(): { perMonth: number; percent: number } {
    const perMonth = PLANS.annual.price / 12;
    const percent = Math.round((1 - perMonth / PLANS.monthly.price) * 100);
    return { perMonth, percent };
}
