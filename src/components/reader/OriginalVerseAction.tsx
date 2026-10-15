"use client";

import { Languages } from "lucide-react";
import {
    VerseActionButton,
    VerseActionLabel,
} from "@/components/reader/VerseActionBar";
import { cn } from "@/lib/cn";

interface OriginalVerseActionProps {
    active: boolean;
    loading: boolean;
    onToggle: () => void;
}

/** Toggles word study: the verse's words become tappable for their Hebrew/Greek. */
export function OriginalVerseAction({
    active,
    loading,
    onToggle,
}: OriginalVerseActionProps) {
    return (
        <VerseActionButton
            aria-pressed={active}
            aria-busy={loading || undefined}
            onClick={onToggle}
            className={cn(active && "bg-reading-bg-subtle")}
        >
            <Languages
                className={cn("h-4 w-4", loading && "animate-pulse")}
                aria-hidden="true"
            />
            <VerseActionLabel>Original</VerseActionLabel>
        </VerseActionButton>
    );
}
