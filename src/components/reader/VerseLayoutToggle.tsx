"use client";

import { List, Pilcrow } from "lucide-react";
import { cn } from "@/lib/cn";
import {
    setVerseLayout,
    useVerseLayout,
    type VerseLayout,
} from "./useVerseLayout";

const LAYOUTS: {
    value: VerseLayout;
    label: string;
    icon: React.ElementType;
}[] = [
    { value: "paragraphs", label: "Paragraphs", icon: Pilcrow },
    { value: "verses", label: "Verses", icon: List },
];

/** Paragraphs (poetry in lines) or one verse per line. */
export function VerseLayoutToggle() {
    const layout = useVerseLayout();

    return (
        <div
            role="group"
            aria-label="Text layout"
            className="flex h-11 overflow-hidden rounded-md border border-reading-border-strong bg-reading-surface-raised"
        >
            {LAYOUTS.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setVerseLayout(value)}
                    aria-pressed={layout === value}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 px-3 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-reading-focus",
                        layout === value
                            ? "bg-reading-accent text-reading-accent-contrast"
                            : "text-reading-text hover:bg-reading-bg-subtle",
                    )}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                </button>
            ))}
        </div>
    );
}
