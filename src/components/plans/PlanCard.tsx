"use client";

import Link from "next/link";
import { useTransition } from "react";
import { enrollAction } from "@/app/plans/actions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast";
import type { ReadingPlan } from "@/lib/reading-plans";

interface PlanCardProps {
    plan: ReadingPlan;
    signedIn: boolean;
}

export function PlanCard({ plan, signedIn }: PlanCardProps) {
    const toast = useToast();
    const [pending, startTransition] = useTransition();

    function start() {
        startTransition(async () => {
            const result = await enrollAction(plan.slug);
            if (!result.ok) toast.error(result.error);
        });
    }

    return (
        <article className="flex flex-col gap-3 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-5">
            <div className="flex flex-col gap-1">
                <h3 className="font-serif text-2xl text-reading-text">
                    {plan.name}
                </h3>
                <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                    {plan.durationDays} days
                </p>
            </div>
            <p className="flex-1 text-sm text-reading-text">
                {plan.description}
            </p>
            {signedIn ? (
                <Button
                    size="sm"
                    onClick={start}
                    loading={pending}
                    className="self-start"
                >
                    Start plan
                </Button>
            ) : (
                <Link
                    href="/login?next=%2Fplans"
                    className="self-start text-sm font-medium text-reading-link"
                >
                    Sign in to start
                </Link>
            )}
        </article>
    );
}
