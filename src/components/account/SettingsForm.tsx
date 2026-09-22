"use client";

import { Moon, Scroll, Sun } from "lucide-react";
import { useActionState, useState } from "react";
import { saveSettings, type SettingsState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { useReadingMode, type ReadingMode } from "@/context/reading-mode";
import { cn } from "@/lib/cn";

const MODES: { value: ReadingMode; label: string; icon: React.ElementType }[] =
    [
        { value: "light", label: "Light", icon: Sun },
        { value: "sepia", label: "Sepia", icon: Scroll },
        { value: "dark", label: "Dark", icon: Moon },
    ];

const SCALE_MIN = 80;
const SCALE_MAX = 140;
const SCALE_STEP = 10;

export function SettingsForm({
    initialMode,
    initialFontScale,
}: {
    initialMode: ReadingMode;
    initialFontScale: number;
}) {
    const { setMode, setFontScale } = useReadingMode();
    const [mode, setLocalMode] = useState(initialMode);
    const [fontScale, setLocalFontScale] = useState(initialFontScale);
    const [state, action, pending] = useActionState<SettingsState, FormData>(
        saveSettings,
        {},
    );

    function chooseMode(next: ReadingMode) {
        setLocalMode(next);
        setMode(next); // applies instantly; the save persists it
    }

    function chooseFontScale(next: number) {
        setLocalFontScale(next);
        setFontScale(next);
    }

    return (
        <form action={action} className="flex flex-col gap-8">
            <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                    Reading mode
                </legend>
                <div className="grid grid-cols-3 gap-2">
                    {MODES.map(({ value, label, icon: Icon }) => (
                        <label
                            key={value}
                            className={cn(
                                "flex cursor-pointer flex-col items-center gap-2 rounded-md border px-3 py-4 text-sm transition-colors",
                                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-reading-focus has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-reading-bg",
                                mode === value
                                    ? "border-reading-border-strong bg-reading-accent text-reading-accent-contrast"
                                    : "border-reading-border-strong bg-reading-surface-raised text-reading-text hover:bg-reading-bg-subtle",
                            )}
                        >
                            <input
                                type="radio"
                                name="readingMode"
                                value={value}
                                checked={mode === value}
                                onChange={() => chooseMode(value)}
                                className="sr-only"
                            />
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            {label}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="flex flex-col gap-3">
                <label
                    htmlFor="fontScale"
                    className="flex items-baseline justify-between"
                >
                    <span className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Scripture text size
                    </span>
                    <span className="text-sm tabular-nums text-reading-text">
                        {fontScale}%
                    </span>
                </label>
                <input
                    id="fontScale"
                    name="fontScale"
                    type="range"
                    min={SCALE_MIN}
                    max={SCALE_MAX}
                    step={SCALE_STEP}
                    value={fontScale}
                    onChange={(e) => chooseFontScale(Number(e.target.value))}
                    className="w-full accent-[var(--reading-accent)]"
                    aria-valuetext={`${fontScale} percent`}
                />
                <p
                    className="reading-scale rounded-md border border-reading-divider bg-reading-surface-raised px-4 py-3 font-serif text-reading-text"
                    aria-hidden="true"
                >
                    In the beginning God created the heaven and the earth.
                </p>
            </div>

            {state.error && (
                <p role="alert" className="text-sm text-reading-danger">
                    {state.error}
                </p>
            )}
            <div className="flex items-center gap-3">
                <Button type="submit" loading={pending}>
                    Save settings
                </Button>
                {state.saved && !state.error && (
                    <span
                        role="status"
                        className="text-sm text-reading-text-muted"
                    >
                        Saved.
                    </span>
                )}
            </div>
        </form>
    );
}
