"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SearchResult } from "@/lib/bible/types";
import { addRecentSearch } from "@/lib/search-history";
import { RecentSearches } from "./RecentSearches";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

interface CompletedSearch {
    query: string;
    results: SearchResult[];
    error: string | null;
}

export function SearchPageClient() {
    const initialQuery = useSearchParams().get("q")?.trim() ?? "";
    const [value, setValue] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [completed, setCompleted] = useState<CompletedSearch | null>(null);

    useEffect(() => {
        if (!query) return;
        const controller = new AbortController();

        (async () => {
            try {
                const response = await fetch(
                    `/api/bible/search?q=${encodeURIComponent(query)}`,
                    { signal: controller.signal },
                );
                if (!response.ok) {
                    const body = (await response.json().catch(() => null)) as {
                        error?: string;
                    } | null;
                    throw new Error(body?.error ?? "Search failed.");
                }
                const body = (await response.json()) as {
                    results: SearchResult[];
                };
                addRecentSearch(query);
                setCompleted({ query, results: body.results, error: null });
            } catch (cause) {
                if (controller.signal.aborted) return;
                setCompleted({
                    query,
                    results: [],
                    error:
                        cause instanceof Error
                            ? cause.message
                            : "Search is unavailable right now. Please try again.",
                });
            }
        })();

        return () => controller.abort();
    }, [query]);

    const handleQueryChange = useCallback((nextQuery: string) => {
        setQuery(nextQuery);
        // Shallow URL sync so searches are shareable without a navigation.
        window.history.replaceState(
            null,
            "",
            nextQuery
                ? `/search?q=${encodeURIComponent(nextQuery)}`
                : "/search",
        );
    }, []);

    const rerunSearch = useCallback(
        (nextQuery: string) => {
            setValue(nextQuery);
            handleQueryChange(nextQuery);
        },
        [handleQueryChange],
    );

    const active = query && completed?.query === query ? completed : null;
    const loading = Boolean(query) && !active;

    return (
        <div className="flex flex-col gap-6">
            <SearchInput
                value={value}
                loading={loading}
                onValueChange={setValue}
                onQueryChange={handleQueryChange}
            />
            {query ? (
                <SearchResults
                    query={query}
                    results={active?.results ?? []}
                    loading={loading}
                    error={active?.error ?? null}
                />
            ) : (
                <>
                    <RecentSearches onSelect={rerunSearch} />
                    <SearchResults
                        query={query}
                        results={[]}
                        loading={false}
                        error={null}
                    />
                </>
            )}
        </div>
    );
}
