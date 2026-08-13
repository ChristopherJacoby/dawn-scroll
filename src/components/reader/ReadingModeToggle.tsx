"use client";

import { Moon, Scroll, Sun } from "lucide-react";
import { useReadingMode, type ReadingMode } from "@/context/reading-mode";
import { cn } from "@/lib/cn";

const MODES: {
    value: ReadingMode;
    label: string;
    icon: React.ElementType;
}[] = [
    { value: "light", label: "Light mode", icon: Sun },
    { value: "sepia", label: "Sepia mode", icon: Scroll },
    { value: "dark", label: "Dark mode", icon: Moon },
];

export function ReadingModeToggle() {
    const { mode, setMode } = useReadingMode();

    return (
        <div
            role="group"
            aria-label="Reading mode"
            className="inline-flex overflow-hidden rounded-md border border-reading-border-strong"
        >
            {MODES.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    aria-pressed={mode === value}
                    aria-label={label}
                    title={label}
                    className={cn(
                        "flex h-9 w-10 items-center justify-center transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-reading-focus",
                        mode === value
                            ? "bg-reading-accent text-reading-accent-contrast"
                            : "text-reading-text-muted hover:bg-reading-bg-subtle hover:text-reading-text",
                    )}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
            ))}
        </div>
    );
}
