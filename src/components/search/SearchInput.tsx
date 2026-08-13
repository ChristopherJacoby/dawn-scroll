"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const DEBOUNCE_MS = 300;

interface SearchInputProps {
    defaultValue?: string;
    loading?: boolean;
    onQueryChange: (query: string) => void;
}

export function SearchInput({
    defaultValue = "",
    loading = false,
    onQueryChange,
}: SearchInputProps) {
    const [value, setValue] = useState(defaultValue);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(
            () => onQueryChange(value.trim()),
            DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [value, onQueryChange]);

    function clear() {
        setValue("");
        onQueryChange("");
    }

    return (
        <div className="relative">
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-reading-text-muted"
            />
            <input
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape" && value) {
                        event.preventDefault();
                        clear();
                    }
                }}
                placeholder="Search the King James Version…"
                aria-label="Search the King James Version"
                autoFocus
                enterKeyHint="search"
                className={cn(
                    "h-12 w-full rounded-md border border-reading-border-strong bg-reading-surface-raised pl-10 pr-20 text-base text-reading-text",
                    "placeholder:text-reading-text-muted",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg",
                    "[&::-webkit-search-cancel-button]:hidden",
                )}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {loading && (
                    <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin text-reading-text-muted"
                    />
                )}
                {value && (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Clear search"
                        className="rounded-md p-1.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
