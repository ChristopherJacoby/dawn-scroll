"use client";

import * as Toolbar from "@radix-ui/react-toolbar";
import { Check, Highlighter } from "lucide-react";
import Link from "next/link";
import {
    VerseActionLabel,
    verseActionClass,
} from "@/components/reader/VerseActionBar";
import { cn } from "@/lib/cn";
import {
    HIGHLIGHT_BG,
    HIGHLIGHT_COLORS,
    HIGHLIGHT_LABELS,
    isHighlightColor,
    type HighlightColor,
} from "@/lib/highlight-colors";

interface HighlightVerseActionProps {
    color: HighlightColor | null;
    /** A color to apply, or null to remove the highlight. */
    onChange: (color: HighlightColor | null) => void;
    /** Where to send signed-out readers; null when signed in. */
    signInHref: string | null;
}

/**
 * Five color swatches; choosing the active one again removes the
 * highlight. Below `md` the swatches take their own row above the actions.
 */
export function HighlightVerseAction({
    color,
    onChange,
    signInHref,
}: HighlightVerseActionProps) {
    if (signInHref) {
        return (
            <Toolbar.Link asChild>
                <Link
                    href={signInHref}
                    aria-label="Highlight (sign in first)"
                    className={verseActionClass}
                >
                    <Highlighter className="h-4 w-4" aria-hidden="true" />
                    <VerseActionLabel>Highlight</VerseActionLabel>
                </Link>
            </Toolbar.Link>
        );
    }

    return (
        <Toolbar.ToggleGroup
            type="single"
            value={color ?? ""}
            onValueChange={(value) =>
                onChange(isHighlightColor(value) ? value : null)
            }
            aria-label="Highlight color"
            className={cn(
                "order-first mb-1 flex w-full justify-center gap-0.5 border-b border-reading-divider pb-1",
                "md:order-none md:mb-0 md:w-auto md:border-0 md:pb-0",
            )}
        >
            {HIGHLIGHT_COLORS.map((option) => (
                <Toolbar.ToggleItem
                    key={option}
                    value={option}
                    aria-label={`${HIGHLIGHT_LABELS[option]} highlight`}
                    title={
                        color === option
                            ? "Choose again to remove the highlight"
                            : undefined
                    }
                    className={cn(
                        "grid h-10 w-10 place-items-center rounded-md transition-colors",
                        "hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                    )}
                >
                    <span
                        className={cn(
                            "grid h-6 w-6 place-items-center rounded-full border",
                            HIGHLIGHT_BG[option],
                            color === option
                                ? "border-2 border-reading-text"
                                : "border-reading-border-strong",
                        )}
                    >
                        {color === option && (
                            <Check
                                className="h-3.5 w-3.5 text-reading-text"
                                strokeWidth={3}
                                aria-hidden="true"
                            />
                        )}
                    </span>
                </Toolbar.ToggleItem>
            ))}
        </Toolbar.ToggleGroup>
    );
}
