import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    Landmark,
    MessageCircleQuestion,
    ScrollText,
    Sprout,
    Users,
} from "lucide-react";
import { CredibilityBadge } from "@/components/archaeology/CredibilityBadge";
import { HeroCollage, type HeroWordStudy } from "@/components/home/HeroCollage";
import { buttonVariants } from "@/components/ui/Button";
import { isAiConfigured } from "@/lib/ai/config";
import { listFindings } from "@/lib/archaeology/queries";
import { getUser } from "@/lib/auth";
import { getVerseWordStudy } from "@/lib/language/queries";
import { readingLabel } from "@/lib/plan-progress";
import { listQuestions } from "@/lib/questions/queries";
import {
    type EnrolledPlan,
    getEnrolledPlans,
    listPlans,
} from "@/lib/reading-plans";
import { listTraditions } from "@/lib/roots/queries";

export const metadata: Metadata = {
    title: "Dawnscroll",
    description:
        "Read the Bible with the Hebrew and Greek behind the English, the archaeology that bears on the text, and where Christian traditions came from.",
};

/** A failed fetch drops its section instead of taking down the front door. */
async function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
    try {
        return await promise;
    } catch {
        return fallback;
    }
}

/** Psalm 23:1's "shepherd" (רֹעִי), for the hero's word study panel. */
async function shepherdStudy(): Promise<HeroWordStudy | null> {
    const study = await getVerseWordStudy({
        book: "psalms",
        chapter: 23,
        verse: 1,
        translation: "kjv",
    });
    const index = study?.words.findIndex((w) => w.s === "H7462") ?? -1;
    if (!study || index < 0) return null;
    const word = study.words[index];
    return {
        mapping: { s: word.s, o: index },
        word,
        entry: study.entries[word.s] ?? null,
        features: word.m ? (study.morphology[word.m] ?? null) : null,
    };
}

const OPENINGS = [
    {
        href: "/read/genesis/1",
        reference: "Genesis 1",
        line: "In the beginning God created the heaven and the earth.",
    },
    {
        href: "/read/psalms/23",
        reference: "Psalm 23",
        line: "The LORD is my shepherd; I shall not want.",
    },
    {
        href: "/read/john/1",
        reference: "John 1",
        line: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    },
];

/** Finds that show the whole rating scale, strongest first. */
const SAMPLE_FINDINGS = [
    "pilate-stone",
    "jericho-walls",
    "red-sea-chariot-wheels",
];

export default async function HomePage() {
    const user = await getUser();
    const [study, findings, traditions, questions, plans, enrolled] =
        await Promise.all([
            optional(shepherdStudy(), null),
            optional(listFindings(), { findings: [], total: 0 }),
            optional(listTraditions(), []),
            optional(listQuestions(), []),
            optional(listPlans(), []),
            user ? optional(getEnrolledPlans(), []) : [],
        ]);
    const heroFinding =
        findings.findings.find((f) => f.slug === "tel-dan-stele") ?? null;
    const sampleFindings = SAMPLE_FINDINGS.flatMap(
        (slug) => findings.findings.find((f) => f.slug === slug) ?? [],
    );
    const today = enrolled.find((entry) => entry.currentDay !== null);
    const aiEnabled = isAiConfigured();

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <section className="border-b border-reading-divider bg-dawn-glow">
                <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 pt-12 md:px-10 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center lg:gap-8 lg:py-12">
                    <div className="flex flex-col gap-6">
                        <h1 className="font-serif text-4xl leading-[1.08] text-balance text-reading-text sm:text-5xl xl:text-6xl">
                            Read the Bible in the world it came from
                        </h1>
                        <p className="max-w-xl text-lg leading-relaxed text-reading-text-muted">
                            Every chapter, with the Hebrew and Greek behind the
                            English, the archaeology that bears on the text, and
                            where Christian traditions came from, with every
                            claim rated against the evidence.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/read/john/1"
                                className={buttonVariants({ size: "lg" })}
                            >
                                Start reading
                                <ArrowRight
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link
                                href="/plans"
                                className={buttonVariants({
                                    variant: "secondary",
                                    size: "lg",
                                })}
                            >
                                Reading plans
                            </Link>
                        </div>
                        <p className="text-sm text-reading-text-muted">
                            Free to read, no account needed.
                        </p>
                    </div>
                    <HeroCollage study={study} finding={heroFinding} />
                </div>
            </section>

            <section
                aria-labelledby="start-heading"
                className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-14 md:px-10"
            >
                <h2
                    id="start-heading"
                    className="font-serif text-3xl text-reading-text"
                >
                    Start reading
                </h2>
                {today && <TodaysReading entry={today} />}
                <ul className="grid divide-y divide-reading-divider border-y border-reading-divider lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    {OPENINGS.map((opening) => (
                        <li key={opening.href}>
                            <Link
                                href={opening.href}
                                className="group flex h-full flex-col gap-3 px-1 py-6 transition-colors hover:bg-reading-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus lg:px-6"
                            >
                                <span className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                    {opening.reference}
                                </span>
                                <span className="font-serif text-xl leading-snug text-reading-text">
                                    {opening.line}
                                </span>
                                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-reading-link">
                                    Read {opening.reference}
                                    <ArrowRight
                                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                                        aria-hidden="true"
                                    />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
                {plans.length > 0 && (
                    <p className="text-reading-text-muted">
                        Or follow a plan:{" "}
                        {plans.map((plan, i) => (
                            <span key={plan.slug}>
                                {i > 0 && " · "}
                                <Link
                                    href="/plans"
                                    className="text-reading-link"
                                >
                                    {plan.name}
                                </Link>
                            </span>
                        ))}
                    </p>
                )}
            </section>

            <section
                aria-labelledby="explore-heading"
                className="border-t border-reading-divider bg-reading-surface"
            >
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-14 md:px-10">
                    <div className="flex max-w-2xl flex-col gap-2">
                        <h2
                            id="explore-heading"
                            className="font-serif text-3xl text-reading-text"
                        >
                            Go deeper
                        </h2>
                        <p className="text-reading-text-muted">
                            Finds and popular claims are rated against the
                            evidence, from what&rsquo;s established to what
                            doesn&rsquo;t hold up, with the sources to check for
                            yourself.
                        </p>
                    </div>
                    <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
                        <ExploreColumn
                            icon={Landmark}
                            title="Archaeology"
                            href="/archaeology"
                            description={
                                findings.total > 0
                                    ? `${findings.total} finds that bear on the biblical text, from inscriptions naming its kings to claims that haven’t held up.`
                                    : "Finds that bear on the biblical text, from inscriptions naming its kings to claims that haven’t held up."
                            }
                            more="See every find"
                        >
                            {sampleFindings.map((finding) => (
                                <li
                                    key={finding.slug}
                                    className="flex flex-col items-start gap-1"
                                >
                                    <CredibilityBadge
                                        rating={finding.credibility}
                                    />
                                    <Link
                                        href={`/archaeology/${finding.slug}`}
                                        className="font-serif text-lg leading-snug text-reading-text hover:underline"
                                    >
                                        {finding.title}
                                    </Link>
                                </li>
                            ))}
                        </ExploreColumn>
                        <ExploreColumn
                            icon={Sprout}
                            title="Roots"
                            href="/roots"
                            description="Where Christian traditions came from: what the sources document, and the popular claims about each, rated against the evidence."
                            more="See every tradition"
                        >
                            {traditions.slice(0, 4).map((tradition) => (
                                <li key={tradition.slug}>
                                    <Link
                                        href={`/roots/${tradition.slug}`}
                                        className="font-serif text-lg text-reading-text hover:underline"
                                    >
                                        {tradition.name}
                                    </Link>
                                </li>
                            ))}
                        </ExploreColumn>
                        <ExploreColumn
                            icon={MessageCircleQuestion}
                            title="Hard Questions"
                            href="/questions"
                            description="Arguments that nature points to a designer, each given as its proponents make it, followed by the main critiques."
                            more="See every question"
                        >
                            {questions.slice(0, 3).map((question) => (
                                <li key={question.slug}>
                                    <Link
                                        href={`/questions/${question.slug}`}
                                        className="font-serif text-lg leading-snug text-reading-text hover:underline"
                                    >
                                        {question.title}
                                    </Link>
                                </li>
                            ))}
                        </ExploreColumn>
                    </div>
                </div>
            </section>

            {aiEnabled && (
                <section
                    aria-labelledby="ask-heading"
                    className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-14 md:px-10"
                >
                    <h2
                        id="ask-heading"
                        className="font-serif text-3xl text-reading-text"
                    >
                        Ask
                    </h2>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <AskLink
                            icon={ScrollText}
                            href="/scholar"
                            title="Scholar"
                            description="Ask about the customs, laws, places and people of the biblical world, with answers that cite the passages they rely on."
                        />
                        <AskLink
                            icon={Users}
                            href="/apostles"
                            title="Apostles"
                            description="Talk with the Twelve and Paul about their lives and what they saw, in AI portrayals grounded in Scripture."
                        />
                    </div>
                </section>
            )}
        </div>
    );
}

function TodaysReading({ entry }: { entry: EnrolledPlan }) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
                <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                    Today&rsquo;s reading · {entry.plan.name}, day{" "}
                    {entry.currentDay} of {entry.plan.durationDays}
                </p>
                <p className="flex flex-wrap gap-x-4 font-serif text-2xl">
                    {entry.readings.map((reading) => (
                        <Link
                            key={`${reading.bookSlug}-${reading.startChapter}`}
                            href={`/read/${reading.bookSlug}/${reading.startChapter}`}
                            className="text-reading-link"
                        >
                            {readingLabel(reading)}
                        </Link>
                    ))}
                </p>
            </div>
            <Link
                href="/plans"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
                Open your plan
            </Link>
        </div>
    );
}

function ExploreColumn({
    icon: Icon,
    title,
    href,
    description,
    more,
    children,
}: {
    icon: React.ElementType;
    title: string;
    href: string;
    description: string;
    more: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 border-t border-reading-border-strong pt-5">
            <div className="flex items-center gap-2 text-reading-text">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-serif text-2xl">
                    <Link href={href} className="hover:underline">
                        {title}
                    </Link>
                </h3>
            </div>
            <p className="text-sm leading-relaxed text-reading-text-muted">
                {description}
            </p>
            <ul className="flex flex-col gap-3">{children}</ul>
            <Link
                href={href}
                className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-reading-link"
            >
                {more}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
        </div>
    );
}

function AskLink({
    icon: Icon,
    href,
    title,
    description,
}: {
    icon: React.ElementType;
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group flex gap-4 rounded-lg border border-reading-border p-5 transition-colors hover:bg-reading-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
        >
            <Icon
                className="mt-1 h-5 w-5 shrink-0 text-reading-text"
                aria-hidden="true"
            />
            <span className="flex flex-col gap-1">
                <span className="font-serif text-2xl text-reading-text">
                    {title}
                </span>
                <span className="text-sm leading-relaxed text-reading-text-muted">
                    {description}
                </span>
            </span>
        </Link>
    );
}
