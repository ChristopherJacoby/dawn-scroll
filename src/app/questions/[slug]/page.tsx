import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PullQuote } from "@/components/questions/PullQuote";
import { CitedProse } from "@/components/roots/CitedProse";
import { ClaimRatingBadge } from "@/components/roots/ClaimRatingBadge";
import { formatCalendarDate } from "@/lib/dates";
import { getQuestion } from "@/lib/questions/queries";
import { QUESTION_CATEGORIES, QUESTION_RATINGS } from "@/lib/questions/ratings";

interface QuestionPageProps {
    params: Promise<{ slug: string }>;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function load(slug: string) {
    return SLUG.test(slug) ? getQuestion(slug) : null;
}

export async function generateMetadata({
    params,
}: QuestionPageProps): Promise<Metadata> {
    const question = await load((await params).slug);
    if (!question) return { title: "Question not found | Dawnscroll" };
    return {
        title: `${question.title} | Dawnscroll`,
        description: question.summary,
    };
}

const sectionHeading =
    "text-xs font-medium uppercase tracking-wide text-reading-text-muted";
const prose =
    "flex flex-col gap-4 font-serif text-lg leading-relaxed text-reading-text";

function Prose({ paragraphs }: { paragraphs: string[] }) {
    return (
        <div className={prose}>
            {paragraphs.map((paragraph, i) => (
                <p key={i}>
                    <CitedProse text={paragraph} />
                </p>
            ))}
        </div>
    );
}

export default async function QuestionPage({ params }: QuestionPageProps) {
    const question = await load((await params).slug);
    if (!question) notFound();

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <article className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-12 md:px-10 md:py-16 print:max-w-none print:gap-6 print:px-0 print:py-0">
                <header className="flex flex-col gap-4">
                    <Link
                        href="/questions"
                        className="inline-flex items-center gap-1 self-start text-sm text-reading-link print:hidden"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        All questions
                    </Link>
                    <p className={sectionHeading}>
                        {QUESTION_CATEGORIES[question.category]}
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        {question.title}
                    </h1>
                    <p className="font-serif text-xl leading-relaxed text-reading-text">
                        {question.summary}
                    </p>
                </header>

                <section
                    aria-labelledby="argument-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="argument-heading" className={sectionHeading}>
                        The argument
                    </h2>
                    <Prose paragraphs={question.argument} />
                </section>

                {question.quotes.length > 0 && (
                    <section
                        aria-labelledby="quotes-heading"
                        className="flex flex-col gap-5"
                    >
                        <h2 id="quotes-heading" className={sectionHeading}>
                            In their words
                        </h2>
                        {question.quotes.map((quote) => (
                            <PullQuote key={quote.quote} quote={quote} />
                        ))}
                    </section>
                )}

                <section
                    aria-labelledby="critiques-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="critiques-heading" className={sectionHeading}>
                        The main critiques
                    </h2>
                    <Prose paragraphs={question.critiques} />
                </section>

                <section
                    aria-labelledby="standing-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="standing-heading" className={sectionHeading}>
                        Where it stands
                    </h2>
                    <Prose paragraphs={question.standing} />
                </section>

                <section
                    aria-labelledby="claims-heading"
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-1">
                        <h2 id="claims-heading" className={sectionHeading}>
                            Key claims
                        </h2>
                        <p className="text-sm text-reading-text-muted">
                            Each claim is rated against the evidence.{" "}
                            <Link
                                href="/questions#ratings"
                                className="text-reading-link print:hidden"
                            >
                                About the ratings
                            </Link>
                        </p>
                    </div>
                    <ul className="flex flex-col gap-4">
                        {question.claims.map((claim) => (
                            <li
                                key={claim.claim}
                                className="flex flex-col gap-2 rounded-lg border-l-2 border-reading-accent bg-reading-surface p-5 break-inside-avoid"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="font-serif text-lg leading-snug text-reading-text">
                                        &ldquo;{claim.claim}&rdquo;
                                    </p>
                                    <ClaimRatingBadge
                                        rating={claim.rating}
                                        scale={QUESTION_RATINGS}
                                    />
                                </div>
                                <p className="leading-relaxed text-reading-text">
                                    <CitedProse text={claim.explanation} />
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>

                {question.related.length > 0 && (
                    <section
                        aria-labelledby="related-heading"
                        className="flex flex-col gap-3 print:hidden"
                    >
                        <h2 id="related-heading" className={sectionHeading}>
                            Related questions
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {question.related.map((related) => (
                                <li key={related.slug}>
                                    <Link
                                        href={`/questions/${related.slug}`}
                                        className="inline-flex items-center gap-1 font-serif text-lg text-reading-link"
                                    >
                                        {related.title}
                                        <ArrowRight
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section
                    aria-labelledby="sources-heading"
                    className="flex flex-col gap-3"
                >
                    <h2 id="sources-heading" className={sectionHeading}>
                        Sources
                    </h2>
                    <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-reading-text">
                        {question.sources.map((source, i) => (
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
                                            className="text-reading-link print:hidden"
                                            rel="noreferrer"
                                        >
                                            Link
                                            <span className="sr-only">
                                                {" "}
                                                to this source
                                            </span>
                                        </a>
                                        {/* Printed pages can't follow links. */}
                                        <span className="hidden break-all print:inline">
                                            {source.url}
                                        </span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ol>
                    <p className="text-xs text-reading-text-muted">
                        Last reviewed {formatCalendarDate(question.reviewedOn)}.
                    </p>
                </section>
            </article>
        </div>
    );
}
