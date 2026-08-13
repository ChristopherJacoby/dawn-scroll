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
            const verse = document.getElementById(hash.slice(1));
            if (!verse) return;
            verse.scrollIntoView();
            // Flash the target verse so the eye lands on the right line;
            // remove-reflow-add restarts the animation on repeat visits.
            verse.classList.remove("verse-flash");
            void verse.offsetWidth;
            verse.classList.add("verse-flash");
            verse.addEventListener(
                "animationend",
                () => verse.classList.remove("verse-flash"),
                { once: true },
            );
        }
        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => window.removeEventListener("hashchange", scrollToHash);
    }, []);

    return null;
}
