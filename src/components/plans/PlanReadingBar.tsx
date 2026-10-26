import { CalendarCheck, Check } from "lucide-react";
import Link from "next/link";
import { readingLabel } from "@/lib/plan-progress";
import type { PlanChapterContext } from "@/lib/reading-plans";

/** Above a chapter that's part of the reader's plan: which day, and where. */
export function PlanReadingBar({ context }: { context: PlanChapterContext }) {
    const { plan, day, readings, index, total, completed } = context;
    return (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-reading-border bg-reading-surface-raised px-4 py-3 font-sans text-sm">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-reading-text">
                <CalendarCheck
                    className="h-4 w-4 shrink-0 text-reading-text-muted"
                    aria-hidden="true"
                />
                <span className="font-semibold">{plan.name}</span>
                <span className="text-reading-text-muted">
                    Day {day} of {plan.durationDays} ·{" "}
                    {readings.map(readingLabel).join(", ")}
                    {completed ? null : (
                        <>
                            {" "}
                            · chapter {index} of {total}
                        </>
                    )}
                </span>
                {completed && (
                    <span className="inline-flex items-center gap-1 font-medium text-reading-text">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Complete
                    </span>
                )}
            </p>
            <Link href="/plans" className="text-reading-link">
                Your plan
            </Link>
        </div>
    );
}
