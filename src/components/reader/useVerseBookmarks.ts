"use client";

import { useRef, useState } from "react";
import { useToast } from "@/context/toast";

interface UseVerseBookmarksOptions {
    /** Verse number → bookmark id, server-rendered for this chapter. */
    initial: Record<number, string>;
    bookSlug: string;
    chapterNumber: number;
    translation: string;
}

function without(map: Record<number, string>, verse: number) {
    const next = { ...map };
    delete next[verse];
    return next;
}

/**
 * The chapter's bookmarks with optimistic toggling: the UI flips
 * immediately and rolls back (with a toast) if the request fails.
 */
export function useVerseBookmarks({
    initial,
    bookSlug,
    chapterNumber,
    translation,
}: UseVerseBookmarksOptions) {
    const toast = useToast();
    const [bookmarks, setBookmarks] = useState(initial);
    // A ref, not state: a second tap must see the in-flight request before
    // React re-renders.
    const inFlight = useRef(new Set<number>());

    async function toggle(verse: number) {
        if (inFlight.current.has(verse)) return;
        inFlight.current.add(verse);
        const existingId = bookmarks[verse];
        setBookmarks((current) =>
            existingId ? without(current, verse) : { ...current, [verse]: "" },
        );

        try {
            const response = existingId
                ? await fetch(`/api/bookmarks/${existingId}`, {
                      method: "DELETE",
                  })
                : await fetch("/api/bookmarks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                          book: bookSlug,
                          chapter: chapterNumber,
                          verse,
                          translation,
                      }),
                  });
            // A 404 on delete means it's already gone, which is the goal.
            if (!response.ok && !(existingId && response.status === 404)) {
                throw response;
            }
            if (!existingId) {
                const { bookmark } = (await response.json()) as {
                    bookmark: { id: string };
                };
                setBookmarks((current) => ({
                    ...current,
                    [verse]: bookmark.id,
                }));
            }
        } catch (error) {
            setBookmarks((current) =>
                existingId
                    ? { ...current, [verse]: existingId }
                    : without(current, verse),
            );
            toast.error(
                error instanceof Response && error.status === 401
                    ? "Your session expired. Sign in again to save bookmarks."
                    : existingId
                      ? "Couldn't remove the bookmark."
                      : "Couldn't save the bookmark.",
            );
        } finally {
            inFlight.current.delete(verse);
        }
    }

    return {
        isBookmarked: (verse: number) => verse in bookmarks,
        toggle,
    };
}
