"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { CREDIBILITY, CREDIBILITY_ORDER } from "@/lib/archaeology/credibility";
import type { CredibilityRating } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

interface Filters {
    book: string | null;
    credibility: CredibilityRating | null;
}

interface FindingFiltersProps extends Filters {
    books: { slug: string; name: string }[];
}

const selectClass = cn(
    "rounded-md border border-reading-border-strong bg-reading-surface-raised px-3 py-2 text-sm text-reading-text",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
);

/**
 * Book and credibility filters. Changing one navigates to the filtered
 * URL; without JavaScript the form submits the same query. The selects
 * are controlled (shown optimistically while the page loads, then from
 * the URL), so they never remount and keyboard focus stays put.
 */
export function FindingFilters({
    books,
    book,
    credibility,
}: FindingFiltersProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [shown, setShown] = useOptimistic<Filters>({ book, credibility });

    function apply(next: Filters) {
        const params = new URLSearchParams();
        if (next.book) params.set("book", next.book);
        if (next.credibility) params.set("credibility", next.credibility);
        const query = params.toString();
        startTransition(() => {
            setShown(next);
            router.replace(query ? `/archaeology?${query}` : "/archaeology", {
                scroll: false,
            });
        });
    }

    return (
        <form
            action="/archaeology"
            onSubmit={(event) => {
                event.preventDefault();
                apply(shown);
            }}
            aria-busy={pending}
            className="flex flex-wrap items-end gap-3 font-sans"
        >
            <label className="flex flex-col gap-1 text-xs font-medium text-reading-text-muted">
                Book
                <select
                    name="book"
                    value={shown.book ?? ""}
                    onChange={(event) =>
                        apply({ ...shown, book: event.target.value || null })
                    }
                    className={selectClass}
                >
                    <option value="">All books</option>
                    {books.map((b) => (
                        <option key={b.slug} value={b.slug}>
                            {b.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-reading-text-muted">
                Credibility
                <select
                    name="credibility"
                    value={shown.credibility ?? ""}
                    onChange={(event) =>
                        apply({
                            ...shown,
                            credibility:
                                (event.target.value as CredibilityRating) ||
                                null,
                        })
                    }
                    className={selectClass}
                >
                    <option value="">Any rating</option>
                    {CREDIBILITY_ORDER.map((rating) => (
                        <option key={rating} value={rating}>
                            {CREDIBILITY[rating].label}
                        </option>
                    ))}
                </select>
            </label>
            <noscript>
                <button
                    type="submit"
                    className="rounded-md border border-reading-border-strong px-3 py-2 text-sm text-reading-text"
                >
                    Filter
                </button>
            </noscript>
        </form>
    );
}
