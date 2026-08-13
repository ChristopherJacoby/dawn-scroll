"use client";

import Link from "next/link";
import type { SearchResult } from "@/lib/bible/types";

interface SearchResultsProps {
    query: string;
    results: SearchResult[];
    loading: boolean;
    error: string | null;
}

export function SearchResults({
    query,
    results,
    loading,
    error,
}: SearchResultsProps) {
    if (!query) {
        return (
            <p className="text-sm text-reading-text-muted">
                Search by words or phrases — for example{" "}
                <em>love your neighbor</em> or{" "}
                <em>&quot;still small voice&quot;</em>.
            </p>
        );
    }

    if (error) {
        return (
            <p role="alert" className="text-sm text-reading-text-muted">
                {error}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <p role="status" className="text-sm text-reading-text-muted">
                {loading
                    ? "Searching…"
                    : results.length === 0
                      ? `No verses found for “${query}”.`
                      : `${results.length} ${results.length === 1 ? "verse" : "verses"} for “${query}”`}
            </p>
            {results.length > 0 && (
                <ul className="flex flex-col gap-3">
                    {results.map((result) => (
                        <li
                            key={`${result.bookSlug}-${result.chapterNumber}-${result.verseNumber}`}
                        >
                            <Link
                                href={`/read/${result.bookSlug}/${result.chapterNumber}#verse-${result.verseNumber}`}
                                className="flex flex-col gap-1.5 rounded-md border border-reading-border bg-reading-surface-raised px-4 py-3 transition-colors hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg"
                            >
                                <span className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                    {result.bookName} {result.chapterNumber}:
                                    {result.verseNumber} ·{" "}
                                    {result.translationAbbreviation}
                                </span>
                                <span className="font-serif text-lg leading-7 text-reading-text">
                                    {result.text}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
