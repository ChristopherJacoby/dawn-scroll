"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CREDIBILITY, CREDIBILITY_ORDER } from "@/lib/archaeology/credibility";
import type { CredibilityRating } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

interface FindingFiltersProps {
    books: { slug: string; name: string }[];
    book: string | null;
    credibility: CredibilityRating | null;
}

const selectClass = cn(
    "rounded-md border border-reading-border-strong bg-reading-surface-raised px-3 py-2 text-sm text-reading-text",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
);

/**
 * Book and credibility filters. Changing one navigates to the filtered
 * URL; without JavaScript the form submits the same query.
 */
export function FindingFilters({
    books,
    book,
    credibility,
}: FindingFiltersProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    function apply(form: HTMLFormElement) {
        const params = new URLSearchParams();
        for (const [key, value] of new FormData(form)) {
            if (typeof value === "string" && value) params.set(key, value);
        }
        const query = params.toString();
        startTransition(() => {
            router.replace(query ? `/archaeology?${query}` : "/archaeology", {
                scroll: false,
            });
        });
    }

    return (
        <form
            action="/archaeology"
            onChange={(event) => apply(event.currentTarget)}
            onSubmit={(event) => {
                event.preventDefault();
                apply(event.currentTarget);
            }}
            aria-busy={pending}
            className="flex flex-wrap items-end gap-3 font-sans"
        >
            <label className="flex flex-col gap-1 text-xs font-medium text-reading-text-muted">
                Book
                <select
                    name="book"
                    defaultValue={book ?? ""}
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
                    defaultValue={credibility ?? ""}
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
