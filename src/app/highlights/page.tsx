import type { Metadata } from "next";
import { HighlightList } from "@/components/highlights/HighlightList";
import { requireAuth } from "@/lib/auth";
import { listHighlights } from "@/lib/highlights";
import { compareCanonical } from "@/lib/verse-ref";

export const metadata: Metadata = {
    title: "Highlights | Dawnscroll",
};

export default async function HighlightsPage() {
    await requireAuth("/highlights");
    const highlights = (await listHighlights()).sort(compareCanonical);

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Your library
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Highlights
                    </h1>
                </div>
                <HighlightList initialHighlights={highlights} />
            </div>
        </div>
    );
}
