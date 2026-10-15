"use client";

import * as Popover from "@radix-ui/react-popover";
import { Landmark } from "lucide-react";
import { FindingCard } from "@/components/archaeology/FindingCard";
import type { FindingSummary } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

/**
 * A small marker beside a verse that has archaeological findings; tapping
 * it opens their summary cards.
 */
export function DigDeeper({ findings }: { findings: FindingSummary[] }) {
    const label =
        findings.length === 1
            ? `Dig deeper: ${findings[0].title}`
            : `Dig deeper: ${findings.length} archaeological findings`;
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    title="Dig deeper"
                    className={cn(
                        "ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-sm align-middle text-reading-accent transition-colors",
                        "hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                        "data-[state=open]:bg-reading-bg-subtle",
                    )}
                >
                    <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={12}
                    className="z-30 flex max-h-[min(28rem,60vh)] w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto rounded-lg border border-reading-border-strong bg-reading-surface p-2 shadow-lg focus:outline-none"
                >
                    <p className="px-2 pt-1 font-sans text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Archaeology
                    </p>
                    {findings.map((finding) => (
                        <FindingCard key={finding.slug} finding={finding} />
                    ))}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
