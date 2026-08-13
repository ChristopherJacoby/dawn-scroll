import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/SearchPageClient";

export const metadata: Metadata = {
    title: "Search | Dawnscroll",
    description: "Search the King James Version by word or phrase.",
};

export default function SearchPage() {
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <header className="border-b border-reading-divider bg-reading-surface">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 md:px-10 md:py-8">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        KJV
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text md:text-5xl">
                        Search
                    </h1>
                </div>
            </header>

            <section className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10 md:py-12">
                <Suspense>
                    <SearchPageClient />
                </Suspense>
            </section>
        </div>
    );
}
