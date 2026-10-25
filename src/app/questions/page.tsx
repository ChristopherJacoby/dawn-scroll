import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClaimRatingBadge } from "@/components/roots/ClaimRatingBadge";
import { listQuestions } from "@/lib/questions/queries";
import { QUESTION_CATEGORIES, QUESTION_RATINGS } from "@/lib/questions/ratings";
import type { QuestionCategory } from "@/lib/questions/types";
import { CLAIM_RATING_ORDER } from "@/lib/roots/ratings";

export const metadata: Metadata = {
    title: "Hard Questions | Dawnscroll",
    description:
        "Arguments from design and cosmology, each with the case as its proponents make it, the main critiques, and rated claims.",
};

export default async function QuestionsPage() {
    const questions = await listQuestions();
    const groups = (Object.keys(QUESTION_CATEGORIES) as QuestionCategory[])
        .map((category) => ({
            category,
            questions: questions.filter((q) => q.category === category),
        }))
        .filter((group) => group.questions.length > 0);

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex max-w-2xl flex-col gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Explore
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Hard Questions
                    </h1>
                    <p className="text-reading-text">
                        Arguments that nature points to a designer, each given
                        as its proponents make it, followed by the main
                        critiques and where the debate stands, with the key
                        claims rated against the evidence.
                    </p>
                </div>

                <details className="group max-w-2xl rounded-lg border border-reading-divider bg-reading-surface p-4 text-sm">
                    <summary className="cursor-pointer font-medium text-reading-text">
                        How the ratings work
                    </summary>
                    <dl
                        id="ratings"
                        className="mt-3 flex scroll-mt-20 flex-col gap-3"
                    >
                        {CLAIM_RATING_ORDER.map((rating) => (
                            <div
                                key={rating}
                                className="flex flex-col items-start gap-1 sm:flex-row sm:gap-3"
                            >
                                <dt className="sm:w-28">
                                    <ClaimRatingBadge
                                        rating={rating}
                                        scale={QUESTION_RATINGS}
                                    />
                                </dt>
                                <dd className="text-reading-text">
                                    {QUESTION_RATINGS[rating].description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-reading-text-muted">
                        Each article rates the observation it starts from, the
                        scientific claim built on it, and the inference to
                        design separately, because they stand or fall on
                        different evidence.
                    </p>
                </details>

                {groups.length > 0 ? (
                    groups.map((group) => (
                        <section
                            key={group.category}
                            aria-labelledby={`category-${group.category}`}
                            className="flex flex-col gap-4"
                        >
                            <h2
                                id={`category-${group.category}`}
                                className="text-xs font-medium uppercase tracking-wide text-reading-text-muted"
                            >
                                {QUESTION_CATEGORIES[group.category]}
                            </h2>
                            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.questions.map((question) => (
                                    <li key={question.slug} className="flex">
                                        <article
                                            aria-labelledby={`question-${question.slug}`}
                                            className="flex w-full flex-col gap-3 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-4 font-sans"
                                        >
                                            <h3
                                                id={`question-${question.slug}`}
                                                className="font-serif text-xl leading-snug text-reading-text"
                                            >
                                                {question.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-reading-text">
                                                {question.summary}
                                            </p>
                                            <Link
                                                href={`/questions/${question.slug}`}
                                                className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-reading-link"
                                            >
                                                Read the debate
                                                <ArrowRight
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                                <span className="sr-only">
                                                    : {question.title}
                                                </span>
                                            </Link>
                                        </article>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                ) : (
                    <p className="rounded-lg border border-reading-divider bg-reading-surface p-6 text-reading-text-muted">
                        No questions are available yet.
                    </p>
                )}
            </div>
        </div>
    );
}
