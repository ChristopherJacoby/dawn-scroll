"use client";

import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { setDayCompleteAction } from "@/app/plans/actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { chapterReference } from "@/lib/bible/references";
import { computeStreak, type PlanChapter } from "@/lib/plan-progress";
import type { PlanChapterContext } from "@/lib/reading-plans";
import { useTimeZone } from "./useTimeZone";

const href = (c: PlanChapter) => `/read/${c.bookSlug}/${c.chapter}`;

/**
 * At the end of a chapter in the reader's plan: the way on through the
 * day's reading, then "Mark day complete" on its last chapter, then the
 * confirmation. Completing revalidates the page, which comes back with the
 * day marked complete. Reading on is never blocked.
 */
export function PlanDayFooter({
    context,
    naturalNext,
}: {
    context: PlanChapterContext;
    /** The next chapter in the Bible, already linked below. */
    naturalNext: { bookSlug: string; chapterNumber: number } | null;
}) {
    const { plan, day, nextInDay, completed, nextDay, completedAt } = context;
    const timeZone = useTimeZone();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    if (completed) {
        const streak = computeStreak(completedAt, new Date(), timeZone);
        return (
            <Panel>
                <div className="flex flex-col gap-1">
                    <p className="font-serif text-2xl text-reading-text">
                        Day {day} complete
                    </p>
                    {streak > 0 && (
                        <p className="flex items-center gap-1.5 text-sm text-reading-text-muted">
                            <Flame
                                className="h-4 w-4 text-reading-accent"
                                aria-hidden="true"
                            />
                            {streak}-day streak
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href="/plans" className={buttonVariants()}>
                        Done for today
                    </Link>
                    {nextDay && (
                        <Link
                            href={href(nextDay.start)}
                            className={buttonVariants({ variant: "secondary" })}
                        >
                            Start day {nextDay.day} now
                        </Link>
                    )}
                </div>
                {!nextDay && (
                    <p className="text-sm text-reading-text-muted">
                        That was the last day of {plan.name}.
                    </p>
                )}
            </Panel>
        );
    }

    if (nextInDay) {
        // The day continues; only worth saying when it jumps somewhere the
        // ordinary Next link doesn't go (e.g. from Psalms to Proverbs).
        const sameAsNext =
            naturalNext?.bookSlug === nextInDay.bookSlug &&
            naturalNext.chapterNumber === nextInDay.chapter;
        if (sameAsNext) return null;
        return (
            <Panel>
                <Link
                    href={href(nextInDay)}
                    className="inline-flex items-center gap-2 self-start font-medium text-reading-link"
                >
                    Next in today&rsquo;s reading:{" "}
                    {chapterReference(nextInDay.bookName, nextInDay.chapter)}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </Panel>
        );
    }

    function complete() {
        setError(null);
        startTransition(async () => {
            const result = await setDayCompleteAction(
                plan.slug,
                day,
                true,
            ).catch(() => null);
            if (!result) setError("Something went wrong. Please try again.");
            else if (!result.ok) setError(result.error);
        });
    }

    return (
        <Panel>
            <div className="flex flex-col gap-1">
                <p className="font-serif text-2xl text-reading-text">
                    That&rsquo;s today&rsquo;s reading
                </p>
                <p className="text-sm text-reading-text-muted">
                    Day {day} of {plan.name}
                </p>
            </div>
            <Button onClick={complete} loading={pending} className="self-start">
                Mark day {day} complete
            </Button>
            {error && (
                <p role="alert" className="text-sm text-reading-danger">
                    {error}
                </p>
            )}
        </Panel>
    );
}

function Panel({ children }: { children: React.ReactNode }) {
    return (
        <section
            aria-label="Reading plan"
            className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-5 pb-8 md:px-10"
        >
            <div className="flex flex-col gap-4 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5">
                {children}
            </div>
        </section>
    );
}
