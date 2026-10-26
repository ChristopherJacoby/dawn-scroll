"use client";

import { useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useEffect } from "react";

/**
 * Prefetches the adjacent chapters in full as soon as a chapter mounts, so
 * previous/next navigation is instant. The reader is a dynamic route (it
 * reads the reader's annotations and translation), and a default prefetch
 * of a dynamic route stops at its loading skeleton, leaving the chapter
 * itself to load on click; a full prefetch includes it, cached for five
 * minutes (staleTimes.static). The nav links only prefetch when they enter
 * the viewport, which on long chapters means not until the reader scrolls
 * to the bottom. No-op in dev (Next.js disables prefetching outside
 * production).
 */
export function ChapterPrefetch({
    previousHref,
    nextHref,
}: {
    previousHref: string | null;
    nextHref: string | null;
}) {
    const router = useRouter();

    useEffect(() => {
        const full = { kind: PrefetchKind.FULL };
        if (previousHref) router.prefetch(previousHref, full);
        if (nextHref) router.prefetch(nextHref, full);
    }, [router, previousHref, nextHref]);

    return null;
}
