"use client";

import { useEffect } from "react";

/**
 * Scrolls to the `#verse-N` anchor after the chapter content mounts.
 * Next.js attempts hash scrolling while the loading fallback is still
 * showing, so the anchor target doesn't exist yet; this retries once the
 * verses are actually in the DOM. Remounted per chapter via `key`.
 */
export function VerseAnchorScroll() {
    useEffect(() => {
        function scrollToHash() {
            const hash = window.location.hash;
            if (!/^#verse-\d+$/.test(hash)) return;
            document.getElementById(hash.slice(1))?.scrollIntoView();
        }
        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => window.removeEventListener("hashchange", scrollToHash);
    }, []);

    return null;
}
