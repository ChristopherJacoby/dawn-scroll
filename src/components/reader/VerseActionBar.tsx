"use client";

import * as Toolbar from "@radix-ui/react-toolbar";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface VerseActionBarProps {
    reference: string;
    onClose: () => void;
    children: React.ReactNode;
    ref?: React.Ref<HTMLDivElement>;
}

/**
 * Actions for the selected verse. Sticks to the bottom of the viewport while
 * the chapter is on screen; Radix Toolbar provides arrow-key navigation.
 * Each action is its own component (children) owning its own state.
 */
export function VerseActionBar({
    reference,
    onClose,
    children,
    ref,
}: VerseActionBarProps) {
    return (
        <Toolbar.Root
            ref={ref}
            aria-label={`Actions for ${reference}`}
            className={cn(
                "sticky bottom-4 z-20 mx-auto mt-8 flex w-fit max-w-full items-center gap-1",
                "rounded-lg border border-reading-border-strong bg-reading-surface-raised p-1.5 font-sans shadow-lg",
            )}
        >
            <span className="px-3 text-sm font-semibold whitespace-nowrap text-reading-text">
                {reference}
            </span>
            <Toolbar.Separator className="mx-1 h-6 w-px bg-reading-divider" />
            {children}
            <VerseActionButton
                onClick={onClose}
                aria-label="Close verse actions"
                className="px-0 text-reading-text-muted"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </VerseActionButton>
        </Toolbar.Root>
    );
}

export const verseActionClass = cn(
    "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-md px-3 font-sans text-sm font-medium text-reading-text transition-colors",
    "hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
);

export function VerseActionButton({
    className,
    ...props
}: React.ComponentProps<typeof Toolbar.Button>) {
    return (
        <Toolbar.Button
            className={cn(verseActionClass, className)}
            {...props}
        />
    );
}

/** Action text: visible from `sm` up, screen-reader-only on phones. */
export function VerseActionLabel({ children }: { children: React.ReactNode }) {
    return <span className="sr-only sm:not-sr-only">{children}</span>;
}
