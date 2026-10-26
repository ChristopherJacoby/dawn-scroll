"use client";

import { Flame, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { leaveAction, setDayCompleteAction } from "@/app/plans/actions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast";
import { computeStreak, readingLabel } from "@/lib/plan-progress";
import type { EnrolledPlan } from "@/lib/reading-plans";
import type { Result } from "@/lib/result";
import { useTimeZone } from "./useTimeZone";

export function ActivePlanCard({ entry }: { entry: EnrolledPlan }) {
    const { plan, completed, currentDay, readings } = entry;
    const toast = useToast();
    const timeZone = useTimeZone();
    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState<"complete" | "undo" | "leave" | null>(
        null,
    );
    const [confirmingLeave, setConfirmingLeave] = useState(false);

    const doneCount = completed.length;
    // Floor, so 364 of 365 doesn't read as 100%.
    const percent = Math.floor((doneCount / plan.durationDays) * 100);
    const streak = computeStreak(
        completed.map((c) => c.completedAt),
        new Date(),
        timeZone,
    );
    const lastCompleted = completed.reduce<(typeof completed)[number] | null>(
        (latest, c) =>
            !latest || c.completedAt > latest.completedAt ? c : latest,
        null,
    );

    function run(
        kind: "complete" | "undo" | "leave",
        action: () => Promise<Result<null>>,
    ) {
        setBusy(kind);
        startTransition(async () => {
            // A failed call (offline, or a deploy since this page loaded)
            // throws; without the catch it would take down the page.
            const result = await action().catch(() => null);
            if (!result) {
                toast.error("Something went wrong. Please try again.");
            } else if (!result.ok) {
                toast.error(result.error);
            }
        });
    }

    return (
        <article
            aria-labelledby={`plan-${plan.slug}`}
            className="flex flex-col gap-5 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h3
                        id={`plan-${plan.slug}`}
                        className="font-serif text-2xl text-reading-text"
                    >
                        {plan.name}
                    </h3>
                    <p className="text-sm text-reading-text-muted">
                        {currentDay ? (
                            <>
                                <span className="rounded bg-reading-accent px-1.5 py-0.5 font-semibold text-reading-accent-contrast">
                                    Day {currentDay}
                                </span>{" "}
                                of {plan.durationDays}
                            </>
                        ) : (
                            `All ${plan.durationDays} days read`
                        )}
                    </p>
                </div>
                {/* A brand-new plan has no streak to show yet. */}
                {streak > 0 && (
                    <p
                        className="flex items-center gap-1.5 text-sm font-medium text-reading-text"
                        title="Consecutive days with a completed reading"
                    >
                        <Flame
                            className="h-4 w-4 text-reading-accent"
                            aria-hidden="true"
                        />
                        {streak}-day streak
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <div
                    role="progressbar"
                    aria-label={`${plan.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={plan.durationDays}
                    aria-valuenow={doneCount}
                    aria-valuetext={`${doneCount} of ${plan.durationDays} days`}
                    className="h-2 overflow-hidden rounded-full bg-reading-bg-subtle"
                >
                    <div
                        className="h-full rounded-full bg-reading-accent transition-[width]"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <p className="text-xs text-reading-text-muted">
                    {doneCount} of {plan.durationDays} days · {percent}%
                </p>
            </div>

            {currentDay ? (
                <div className="flex flex-col gap-3 rounded-md border border-reading-divider bg-reading-bg p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Today&rsquo;s reading
                    </p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {readings.map((reading) => (
                            <li
                                key={`${reading.bookSlug}-${reading.startChapter}`}
                            >
                                <Link
                                    href={`/read/${reading.bookSlug}/${reading.startChapter}`}
                                    className="font-serif text-xl text-reading-link"
                                >
                                    {readingLabel(reading)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Button
                        onClick={() =>
                            run("complete", () =>
                                setDayCompleteAction(
                                    plan.slug,
                                    currentDay,
                                    true,
                                ),
                            )
                        }
                        loading={pending && busy === "complete"}
                        disabled={pending}
                        className="self-start"
                    >
                        Mark day {currentDay} complete
                    </Button>
                </div>
            ) : (
                <p className="flex items-center gap-2 rounded-md border border-reading-divider bg-reading-bg p-4 text-reading-text">
                    <PartyPopper
                        className="h-5 w-5 text-reading-accent"
                        aria-hidden="true"
                    />
                    You finished {plan.name}.
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-sm">
                {lastCompleted && (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                            run("undo", () =>
                                setDayCompleteAction(
                                    plan.slug,
                                    lastCompleted.dayNumber,
                                    false,
                                ),
                            )
                        }
                    >
                        Undo day {lastCompleted.dayNumber}
                    </Button>
                )}
                {confirmingLeave ? (
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="text-reading-text">
                            Leave and erase your progress?
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={pending}
                            loading={pending && busy === "leave"}
                            onClick={() =>
                                run("leave", () => leaveAction(plan.slug))
                            }
                        >
                            Leave plan
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => setConfirmingLeave(false)}
                        >
                            Keep it
                        </Button>
                    </span>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingLeave(true)}
                        className="text-reading-text-muted"
                    >
                        Leave plan…
                    </Button>
                )}
            </div>
        </article>
    );
}
