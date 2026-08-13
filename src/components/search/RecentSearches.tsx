"use client";

import { History, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
    clearRecentSearches,
    getSearchHistoryServerSnapshot,
    getSearchHistorySnapshot,
    subscribeToSearchHistory,
} from "@/lib/search-history";

interface RecentSearchesProps {
    onSelect: (query: string) => void;
}

export function RecentSearches({ onSelect }: RecentSearchesProps) {
    const history = useSyncExternalStore(
        subscribeToSearchHistory,
        getSearchHistorySnapshot,
        getSearchHistoryServerSnapshot,
    );

    if (history.length === 0) return null;

    return (
        <section aria-label="Recent searches" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                    Recent searches
                </h2>
                <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Clear
                </button>
            </div>
            <ul className="flex flex-wrap gap-2">
                {history.map((query) => (
                    <li key={query}>
                        <button
                            type="button"
                            onClick={() => onSelect(query)}
                            className="flex items-center gap-1.5 rounded-md border border-reading-border-strong bg-reading-surface-raised px-3 py-1.5 text-sm text-reading-text transition-colors hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg"
                        >
                            <History
                                className="h-3.5 w-3.5 text-reading-text-muted"
                                aria-hidden="true"
                            />
                            {query}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
