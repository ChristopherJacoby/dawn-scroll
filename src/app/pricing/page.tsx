import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { buttonVariants } from "@/components/ui/Button";
import { getUser } from "@/lib/auth";
import { FEATURES, type FeatureKey } from "@/lib/premium/features";
import {
    annualSavings,
    formatPrice,
    type PlanKey,
    PLANS,
    TRIAL_DAYS,
} from "@/lib/premium/plans";
import { getSubscriptionRecord } from "@/lib/premium/subscription";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
    title: "Premium | Dawnscroll",
    description:
        "Dawnscroll Premium: the full archaeology hub, Apostle mode and unlimited Scholar chat.",
};

export default async function PricingPage({
    searchParams,
}: {
    searchParams: Promise<{ checkout?: string }>;
}) {
    const [user, status, params] = await Promise.all([
        getUser(),
        getSubscriptionRecord().catch(() => null),
        searchParams,
    ]);
    const checkoutAvailable = Boolean(process.env.STRIPE_SECRET_KEY);
    const savings = annualSavings();
    const planCards: {
        plan: PlanKey;
        title: string;
        price: string;
        detail: string;
        highlight?: string;
    }[] = [
        {
            plan: "annual",
            title: "Annual",
            price: `${formatPrice(PLANS.annual.price)} a year`,
            detail: `${formatPrice(savings.perMonth)} a month, billed yearly`,
            highlight: `Save ${savings.percent}%`,
        },
        {
            plan: "monthly",
            title: "Monthly",
            price: `${formatPrice(PLANS.monthly.price)} a month`,
            detail: "Billed monthly",
        },
    ];

    function cta(plan: PlanKey) {
        if (status?.isPremium) {
            return (
                <Link
                    href="/account/subscription"
                    className={cn(
                        buttonVariants({ variant: "secondary", size: "lg" }),
                        "w-full",
                    )}
                >
                    Manage your subscription
                </Link>
            );
        }
        if (!checkoutAvailable) {
            return (
                <p className="rounded-md border border-reading-divider px-4 py-3 text-center text-sm text-reading-text-muted">
                    Subscriptions open soon.
                </p>
            );
        }
        if (!user) {
            return (
                <Link
                    href="/login?next=%2Fpricing"
                    className={cn(
                        buttonVariants({
                            variant:
                                plan === "annual" ? "primary" : "secondary",
                            size: "lg",
                        }),
                        "w-full",
                    )}
                >
                    Sign in to start your free trial
                </Link>
            );
        }
        return (
            <CheckoutButton
                plan={plan}
                label={`Start ${TRIAL_DAYS}-day free trial`}
                variant={plan === "annual" ? "primary" : "secondary"}
            />
        );
    }

    const rows = Object.keys(FEATURES) as FeatureKey[];

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-12 md:px-10 md:py-16">
                <div className="flex max-w-2xl flex-col gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Dawnscroll Premium
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Go deeper
                    </h1>
                    <p className="text-reading-text">
                        The Bible, its original languages, Roots and Hard
                        Questions stay free. Premium adds the full archaeology
                        hub, Apostle mode and unlimited Scholar chat.{" "}
                        {TRIAL_DAYS} days free; cancel anytime.
                    </p>
                </div>

                {params.checkout === "canceled" && (
                    <p
                        role="status"
                        className="rounded-md border border-reading-border-strong bg-reading-surface-raised px-4 py-3 text-sm text-reading-text"
                    >
                        Checkout was canceled. You haven&rsquo;t been charged.
                    </p>
                )}

                <section
                    id="plans"
                    aria-label="Plans"
                    className="grid scroll-mt-20 gap-4 md:grid-cols-2"
                >
                    {planCards.map((card) => (
                        <article
                            key={card.plan}
                            aria-labelledby={`plan-${card.plan}`}
                            className={cn(
                                "flex flex-col gap-4 rounded-lg border bg-reading-surface-raised p-6 font-sans",
                                card.highlight
                                    ? "border-reading-accent"
                                    : "border-reading-border-strong",
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h2
                                    id={`plan-${card.plan}`}
                                    className="font-serif text-2xl text-reading-text"
                                >
                                    {card.title}
                                </h2>
                                {card.highlight && (
                                    <span className="rounded bg-reading-accent px-2 py-0.5 text-xs font-semibold text-reading-accent-contrast">
                                        {card.highlight}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-reading-text">
                                    {card.price}
                                </p>
                                <p className="text-sm text-reading-text-muted">
                                    {card.detail}
                                </p>
                            </div>
                            <div className="mt-auto">{cta(card.plan)}</div>
                        </article>
                    ))}
                </section>

                <section
                    aria-labelledby="compare-heading"
                    className="flex flex-col gap-3"
                >
                    <h2
                        id="compare-heading"
                        className="text-xs font-medium uppercase tracking-wide text-reading-text-muted"
                    >
                        What&rsquo;s included
                    </h2>
                    <table className="w-full border-collapse font-sans text-sm text-reading-text">
                        <thead>
                            <tr className="border-b border-reading-divider text-left text-reading-text-muted">
                                <th scope="col" className="py-2 font-medium">
                                    Feature
                                </th>
                                <th
                                    scope="col"
                                    className="w-20 py-2 text-center font-medium"
                                >
                                    Free
                                </th>
                                <th
                                    scope="col"
                                    className="w-20 py-2 text-center font-medium"
                                >
                                    Premium
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((feature) => {
                                const free = FEATURES[feature].tier === "free";
                                return (
                                    <tr
                                        key={feature}
                                        className="border-b border-reading-divider"
                                    >
                                        <th
                                            scope="row"
                                            className="py-2.5 pr-3 text-left font-normal"
                                        >
                                            {FEATURES[feature].label}
                                        </th>
                                        <td className="text-center">
                                            {free ? (
                                                <Check
                                                    className="mx-auto h-4 w-4 text-reading-accent"
                                                    aria-label="Included"
                                                />
                                            ) : (
                                                <Minus
                                                    className="mx-auto h-4 w-4 text-reading-text-muted"
                                                    aria-label="Not included"
                                                />
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <Check
                                                className="mx-auto h-4 w-4 text-reading-accent"
                                                aria-label="Included"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
}
