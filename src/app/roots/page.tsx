import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClaimRatingBadge } from "@/components/roots/ClaimRatingBadge";
import { listTraditions } from "@/lib/roots/queries";
import { CLAIM_RATING_ORDER, CLAIM_RATINGS } from "@/lib/roots/ratings";

export const metadata: Metadata = {
    title: "Roots | Dawnscroll",
    description:
        "Where Christian traditions came from: the documented history, popular claims rated against the evidence, and the sources.",
};

export default async function RootsPage() {
    const traditions = await listTraditions();

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex max-w-2xl flex-col gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Explore
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Roots
                    </h1>
                    <p className="text-reading-text">
                        Where Christian traditions came from: what the sources
                        document, what the earliest church practiced, and the
                        popular claims about each, rated against the evidence.
                    </p>
                </div>

                <details className="group max-w-2xl rounded-lg border border-reading-divider bg-reading-surface p-4 text-sm">
                    <summary className="cursor-pointer font-medium text-reading-text">
                        How the ratings work
                    </summary>
                    <dl className="mt-3 flex flex-col gap-3">
                        {CLAIM_RATING_ORDER.map((rating) => (
                            <div
                                key={rating}
                                className="flex flex-col items-start gap-1 sm:flex-row sm:gap-3"
                            >
                                <dt className="sm:w-28">
                                    <ClaimRatingBadge rating={rating} />
                                </dt>
                                <dd className="text-reading-text">
                                    {CLAIM_RATINGS[rating].description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-reading-text-muted">
                        Ratings judge historical claims about where a tradition
                        came from, not whether Christians should keep it.
                    </p>
                </details>

                {traditions.length > 0 ? (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {traditions.map((tradition) => (
                            <li key={tradition.slug} className="flex">
                                <article
                                    aria-labelledby={`tradition-${tradition.slug}`}
                                    className="flex w-full flex-col gap-3 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-4 font-sans"
                                >
                                    <h2
                                        id={`tradition-${tradition.slug}`}
                                        className="font-serif text-xl leading-snug text-reading-text"
                                    >
                                        {tradition.name}
                                    </h2>
                                    <p className="text-sm leading-relaxed text-reading-text">
                                        {tradition.summary}
                                    </p>
                                    <Link
                                        href={`/roots/${tradition.slug}`}
                                        className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-reading-link"
                                    >
                                        Read its history
                                        <ArrowRight
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">
                                            : {tradition.name}
                                        </span>
                                    </Link>
                                </article>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="rounded-lg border border-reading-divider bg-reading-surface p-6 text-reading-text-muted">
                        No traditions are available yet.
                    </p>
                )}
            </div>
        </div>
    );
}
