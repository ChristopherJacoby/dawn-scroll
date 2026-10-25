import type { Metadata } from "next";
import Link from "next/link";
import { ManageSubscriptionButton } from "@/components/pricing/ManageSubscriptionButton";
import { buttonVariants } from "@/components/ui/Button";
import { requireAuth } from "@/lib/auth";
import { formatCalendarDate } from "@/lib/dates";
import { PLANS } from "@/lib/premium/plans";
import { getSubscriptionStatus } from "@/lib/premium/subscription";

export const metadata: Metadata = {
    title: "Subscription | Dawnscroll",
};

const STATUS_LABELS: Record<string, string> = {
    trialing: "Free trial",
    active: "Active",
    past_due: "Payment due",
    canceled: "Canceled",
    unpaid: "Unpaid",
    incomplete: "Incomplete",
    incomplete_expired: "Expired",
    paused: "Paused",
};

export default async function SubscriptionPage({
    searchParams,
}: {
    searchParams: Promise<{ checkout?: string }>;
}) {
    await requireAuth("/account/subscription");
    const [status, params] = await Promise.all([
        getSubscriptionStatus(),
        searchParams,
    ]);
    const hasSubscription = status.status !== "none";
    const periodEnd = status.currentPeriodEnd
        ? formatCalendarDate(status.currentPeriodEnd.slice(0, 10))
        : null;

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <Link
                        href="/account"
                        className="self-start text-sm text-reading-link"
                    >
                        Account
                    </Link>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Subscription
                    </h1>
                </div>

                {params.checkout === "success" && (
                    <p
                        role="status"
                        className="rounded-md border border-reading-border-strong bg-reading-surface-raised px-4 py-3 text-sm text-reading-text"
                    >
                        Welcome to Premium. If your plan doesn&rsquo;t show yet,
                        refresh in a moment while Stripe confirms it.
                    </p>
                )}

                <section className="flex flex-col gap-4 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5 font-sans">
                    {hasSubscription ? (
                        <>
                            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm text-reading-text">
                                <dt className="text-reading-text-muted">
                                    Plan
                                </dt>
                                <dd>
                                    {status.plan
                                        ? `Premium ${PLANS[status.plan].label}`
                                        : "Premium"}
                                </dd>
                                <dt className="text-reading-text-muted">
                                    Status
                                </dt>
                                <dd>
                                    {STATUS_LABELS[status.status] ??
                                        status.status}
                                </dd>
                                {periodEnd && (
                                    <>
                                        <dt className="text-reading-text-muted">
                                            {status.cancelAtPeriodEnd ||
                                            status.status === "canceled"
                                                ? "Ends"
                                                : status.status === "trialing"
                                                  ? "Trial ends"
                                                  : "Renews"}
                                        </dt>
                                        <dd>{periodEnd}</dd>
                                    </>
                                )}
                            </dl>
                            <ManageSubscriptionButton />
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-reading-text">
                                You&rsquo;re on the free plan.
                            </p>
                            <Link
                                href="/pricing"
                                className={
                                    buttonVariants({ variant: "primary" }) +
                                    " self-start"
                                }
                            >
                                See Premium
                            </Link>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
