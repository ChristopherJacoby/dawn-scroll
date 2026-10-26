import type { Metadata } from "next";
import Link from "next/link";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, MapPin } from "lucide-react";
import { CredibilityBadge } from "@/components/archaeology/CredibilityBadge";
import { FindingFigure } from "@/components/archaeology/FindingPhoto";
import { FindingVideo } from "@/components/archaeology/FindingVideo";
import { CREDIBILITY } from "@/lib/archaeology/credibility";
import { getFinding } from "@/lib/archaeology/queries";
import { formatScriptureRef, scriptureRefHref } from "@/lib/archaeology/refs";
import { formatCalendarDate } from "@/lib/dates";

interface FindingPageProps {
    params: Promise<{ slug: string }>;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function load(slug: string) {
    return SLUG.test(slug) ? getFinding(slug) : null;
}

export async function generateMetadata({
    params,
}: FindingPageProps): Promise<Metadata> {
    const finding = await load((await params).slug);
    if (!finding) return { title: "Finding not found | Dawnscroll" };
    return {
        title: `${finding.title} | Dawnscroll`,
        description: finding.summary,
    };
}

export default async function FindingPage({ params }: FindingPageProps) {
    const finding = await load((await params).slug);
    if (!finding) notFound();

    const sectionHeading =
        "text-xs font-medium uppercase tracking-wide text-reading-text-muted";

    return (
        <PremiumGate feature="archaeologyHub">
            <div className="flex min-h-full w-full flex-col bg-reading-bg">
                <article className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-12 md:px-10 md:py-16">
                    <header className="flex flex-col gap-4">
                        <Link
                            href="/archaeology"
                            className="inline-flex items-center gap-1 self-start text-sm text-reading-link"
                        >
                            <ArrowLeft
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                            />
                            All findings
                        </Link>
                        <h1 className="font-serif text-4xl leading-tight text-reading-text">
                            {finding.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-reading-text-muted">
                            <CredibilityBadge rating={finding.credibility} />
                            <span className="inline-flex items-center gap-1">
                                <MapPin
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                {finding.siteName}
                            </span>
                        </div>
                        <p className="font-serif text-xl leading-relaxed text-reading-text">
                            {finding.summary}
                        </p>
                    </header>

                    {finding.images.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {finding.images.map((image, i) => (
                                <FindingFigure
                                    key={image.url}
                                    image={image}
                                    preload={i === 0}
                                    sizes="(min-width: 768px) 42rem, 100vw"
                                />
                            ))}
                        </div>
                    )}

                    <section
                        aria-label="Description"
                        className="flex flex-col gap-4 font-serif text-lg leading-relaxed text-reading-text"
                    >
                        {finding.description.map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                        ))}
                    </section>

                    {finding.videos.length > 0 && (
                        <section
                            aria-labelledby="videos-heading"
                            className="flex flex-col gap-4"
                        >
                            <h2 id="videos-heading" className={sectionHeading}>
                                Watch
                            </h2>
                            {finding.videos.map((video) => (
                                <FindingVideo
                                    key={video.youtubeId}
                                    video={video}
                                />
                            ))}
                        </section>
                    )}

                    <section
                        aria-labelledby="credibility-heading"
                        className="flex flex-col gap-3 rounded-lg border-l-2 border-reading-accent bg-reading-surface p-5"
                    >
                        <h2 id="credibility-heading" className={sectionHeading}>
                            Why it&rsquo;s rated{" "}
                            {CREDIBILITY[
                                finding.credibility
                            ].label.toLowerCase()}
                        </h2>
                        <p className="leading-relaxed text-reading-text">
                            {finding.credibilityNote}
                        </p>
                        <p className="text-sm text-reading-text-muted">
                            {CREDIBILITY[finding.credibility].label}:{" "}
                            {CREDIBILITY[finding.credibility].description}{" "}
                            <Link
                                href="/archaeology"
                                className="text-reading-link"
                            >
                                About the ratings
                            </Link>
                        </p>
                    </section>

                    <section
                        aria-labelledby="scripture-heading"
                        className="flex flex-col gap-3"
                    >
                        <h2 id="scripture-heading" className={sectionHeading}>
                            In scripture
                        </h2>
                        <ul className="flex flex-wrap gap-2">
                            {finding.refs.map((ref) => {
                                const label = formatScriptureRef(ref);
                                return (
                                    <li key={label}>
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
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <section
                        aria-labelledby="timeline-heading"
                        className="flex flex-col gap-3"
                    >
                        <h2 id="timeline-heading" className={sectionHeading}>
                            Timeline
                        </h2>
                        <ol className="flex flex-col border-l border-reading-divider">
                            {finding.timeline.map((entry) => (
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
                        aria-labelledby="sources-heading"
                        className="flex flex-col gap-3"
                    >
                        <h2 id="sources-heading" className={sectionHeading}>
                            Sources
                        </h2>
                        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-reading-text">
                            {finding.sources.map((source) => (
                                <li key={source.citation}>
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
                            Last reviewed{" "}
                            {formatCalendarDate(finding.reviewedOn)}.
                        </p>
                    </section>
                </article>
            </div>
        </PremiumGate>
    );
}
