import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { CitedProse } from "@/components/roots/CitedProse";
import { ClaimRatingBadge } from "@/components/roots/ClaimRatingBadge";
import { formatScriptureRef, scriptureRefHref } from "@/lib/archaeology/refs";
import { formatCalendarDate } from "@/lib/dates";
import { getTradition } from "@/lib/roots/queries";

interface TraditionPageProps {
    params: Promise<{ slug: string }>;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function load(slug: string) {
    return SLUG.test(slug) ? getTradition(slug) : null;
}

export async function generateMetadata({
    params,
}: TraditionPageProps): Promise<Metadata> {
    const tradition = await load((await params).slug);
    if (!tradition) return { title: "Tradition not found | Dawnscroll" };
    return {
        title: `${tradition.name}: Roots | Dawnscroll`,
        description: tradition.summary,
    };
}

const sectionHeading =
    "text-xs font-medium uppercase tracking-wide text-reading-text-muted";
const prose =
    "flex flex-col gap-4 font-serif text-lg leading-relaxed text-reading-text";

export default async function TraditionPage({ params }: TraditionPageProps) {
    const tradition = await load((await params).slug);
    if (!tradition) notFound();

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <article className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-12 md:px-10 md:py-16">
                <header className="flex flex-col gap-4">
                    <Link
                        href="/roots"
                        className="inline-flex items-center gap-1 self-start text-sm text-reading-link"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        All traditions
                    </Link>
                    <div className="flex flex-col gap-1">
                        <h1 className="font-serif text-4xl leading-tight text-reading-text">
                            {tradition.name}
                        </h1>
                        {tradition.alsoCalled && (
                            <p className="text-reading-text-muted">
                                {tradition.alsoCalled}
                            </p>
                        )}
                    </div>
                    <p className="font-serif text-xl leading-relaxed text-reading-text">
                        {tradition.summary}
                    </p>
                </header>

                {/* Our position, set apart from the sourced history below. */}
                {tradition.stance && (
                    <section
                        aria-labelledby="stance-heading"
                        className="flex flex-col gap-4 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5 md:p-6"
                    >
                        <h2
                            id="stance-heading"
                            className="font-serif text-2xl leading-snug text-reading-text"
                        >
                            {tradition.stance.heading}
                        </h2>
                        <div className={prose}>
                            {tradition.stance.paragraphs.map((paragraph, i) => (
                                <p key={i}>
                                    <CitedProse text={paragraph} />
                                </p>
                            ))}
                        </div>
                    </section>
                )}

                <section
                    aria-labelledby="origin-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="origin-heading" className={sectionHeading}>
                        Historical origin
                    </h2>
                    <div className={prose}>
                        {tradition.origin.map((paragraph, i) => (
                            <p key={i}>
                                <CitedProse text={paragraph} />
                            </p>
                        ))}
                    </div>
                </section>

                <section
                    aria-labelledby="timeline-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="timeline-heading" className={sectionHeading}>
                        Timeline
                    </h2>
                    <ol className="flex flex-col border-l border-reading-divider">
                        {tradition.timeline.map((entry) => (
                            <li
                                key={`${entry.year}-${entry.event}`}
                                className="relative flex flex-col gap-0.5 pb-4 pl-5 last:pb-0"
                            >
                                <span
                                    className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-reading-accent"
                                    aria-hidden="true"
                                />
                                <span className="text-sm font-semibold text-reading-text">
                                    {entry.label}
                                </span>
                                <span className="text-sm text-reading-text">
                                    {entry.event}
                                </span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section
                    aria-labelledby="scripture-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="scripture-heading" className={sectionHeading}>
                        In scripture
                    </h2>
                    <ul className="flex flex-col gap-3">
                        {tradition.refs.map((ref) => {
                            const label = formatScriptureRef(ref);
                            return (
                                <li
                                    key={label}
                                    className="flex flex-col items-start gap-1.5"
                                >
                                    <Link
                                        href={scriptureRefHref(ref)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-reading-border-strong bg-reading-surface-raised px-3 py-1.5 text-sm text-reading-text transition-colors hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                                    >
                                        <BookOpen
                                            className="h-3.5 w-3.5 text-reading-text-muted"
                                            aria-hidden="true"
                                        />
                                        {label}
                                    </Link>
                                    <p className="text-sm leading-relaxed text-reading-text">
                                        {ref.note}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section
                    aria-labelledby="early-church-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="early-church-heading" className={sectionHeading}>
                        The early church, AD 30&ndash;100
                    </h2>
                    <div className={prose}>
                        {tradition.earlyChurch.map((paragraph, i) => (
                            <p key={i}>
                                <CitedProse text={paragraph} />
                            </p>
                        ))}
                    </div>
                </section>

                <section
                    aria-labelledby="claims-heading"
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-1">
                        <h2 id="claims-heading" className={sectionHeading}>
                            Popular claims
                        </h2>
                        <p className="text-sm text-reading-text-muted">
                            Each claim is rated against the evidence.{" "}
                            <Link
                                href="/roots#ratings"
                                className="text-reading-link"
                            >
                                About the ratings
                            </Link>
                        </p>
                    </div>
                    <ul className="flex flex-col gap-4">
                        {tradition.claims.map((claim) => (
                            <li
                                key={claim.claim}
                                className="flex flex-col gap-2 rounded-lg border-l-2 border-reading-accent bg-reading-surface p-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="font-serif text-lg leading-snug text-reading-text">
                                        &ldquo;{claim.claim}&rdquo;
                                    </p>
                                    <ClaimRatingBadge rating={claim.rating} />
                                </div>
                                <p className="leading-relaxed text-reading-text">
                                    <CitedProse text={claim.explanation} />
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section
                    aria-labelledby="sources-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="sources-heading" className={sectionHeading}>
                        Sources
                    </h2>
                    <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-reading-text">
                        {tradition.sources.map((source, i) => (
                            <li
                                key={source.citation}
                                id={`source-${i + 1}`}
                                className="scroll-mt-20 target:bg-reading-bg-subtle"
                            >
                                {source.citation}
                                {source.url && (
                                    <>
                                        {" "}
                                        <a
                                            href={source.url}
                                            className="text-reading-link"
                                            rel="noreferrer"
                                        >
                                            Link
                                            <span className="sr-only">
                                                {" "}
                                                to this source
                                            </span>
                                        </a>
                                    </>
                                )}
                            </li>
                        ))}
                    </ol>
                    <p className="text-xs text-reading-text-muted">
                        Last reviewed {formatCalendarDate(tradition.reviewedOn)}
                        .
                    </p>
                </section>
            </article>
        </div>
    );
}
