"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Prefetches the adjacent chapters as soon as a chapter mounts, so
 * previous/next navigation is instant. The nav links only prefetch when
 * they enter the viewport, which on long chapters means never until the
 * reader scrolls to the bottom — this covers the gap. No-op in dev
 * (Next.js disables prefetching outside production).
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
        if (previousHref) router.prefetch(previousHref);
        if (nextHref) router.prefetch(nextHref);
    }, [router, previousHref, nextHref]);

    return null;
}
