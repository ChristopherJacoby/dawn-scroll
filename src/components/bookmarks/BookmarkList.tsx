"use client";

import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/toast";
import type { Bookmark } from "@/lib/bookmarks";
import { verseHref } from "@/lib/verse-ref";

function reference(bookmark: Bookmark) {
    return `${bookmark.bookName} ${bookmark.chapterNumber}:${bookmark.verseNumber}`;
}

export function BookmarkList({
    initialBookmarks,
}: {
    initialBookmarks: Bookmark[];
}) {
    const toast = useToast();
    const [bookmarks, setBookmarks] = useState(initialBookmarks);

    async function remove(bookmark: Bookmark) {
        const index = bookmarks.indexOf(bookmark);
        setBookmarks((current) => current.filter((b) => b.id !== bookmark.id));
        const response = await fetch(`/api/bookmarks/${bookmark.id}`, {
            method: "DELETE",
        }).catch(() => null);
        if (response && (response.ok || response.status === 404)) return;
        setBookmarks((current) => {
            const next = [...current];
            next.splice(index, 0, bookmark);
            return next;
        });
        toast.error(`Couldn't remove ${reference(bookmark)}.`);
    }

    if (bookmarks.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-reading-border-strong px-6 py-12 text-center">
                <BookmarkIcon
                    className="h-6 w-6 text-reading-text-muted"
                    aria-hidden="true"
                />
                <p className="text-base text-reading-text">No bookmarks yet.</p>
                <p className="max-w-sm text-sm text-reading-text-muted">
                    Tap a verse in the reader and choose Bookmark to keep it
                    here.
                </p>
                <Link
                    href="/reader"
                    className="mt-2 text-sm font-medium text-reading-link"
                >
                    Open the reader
                </Link>
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-3">
            {bookmarks.map((bookmark) => (
                <li
                    key={bookmark.id}
                    className="flex items-start gap-2 rounded-lg border border-reading-border-strong bg-reading-surface-raised"
                >
                    <Link
                        href={verseHref(
                            bookmark.bookSlug,
                            bookmark.chapterNumber,
                            bookmark.verseNumber,
                        )}
                        className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg p-4 transition-colors hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
                            <span className="font-semibold text-reading-text">
                                {reference(bookmark)}
                            </span>
                            <span className="text-xs text-reading-text-muted">
                                {bookmark.translation} · Added{" "}
                                <time
                                    dateTime={bookmark.createdAt}
                                    suppressHydrationWarning
                                >
                                    {new Date(
                                        bookmark.createdAt,
                                    ).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </time>
                            </span>
                        </span>
                        <span className="line-clamp-2 font-serif text-lg leading-snug text-reading-text">
                            {bookmark.text}
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => remove(bookmark)}
                        aria-label={`Remove bookmark: ${reference(bookmark)}`}
                        className="m-2 rounded-md p-2.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </li>
            ))}
        </ul>
    );
}
