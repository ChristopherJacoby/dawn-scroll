"use client";

import * as Toolbar from "@radix-ui/react-toolbar";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import {
    VerseActionButton,
    VerseActionLabel,
    verseActionClass,
} from "@/components/reader/VerseActionBar";
import { cn } from "@/lib/cn";

interface BookmarkVerseActionProps {
    bookmarked: boolean;
    onToggle: () => void;
    /** Where to send signed-out readers; null when signed in. */
    signInHref: string | null;
}

export function BookmarkVerseAction({
    bookmarked,
    onToggle,
    signInHref,
}: BookmarkVerseActionProps) {
    if (signInHref) {
        return (
            <Toolbar.Link asChild>
                <Link
                    href={signInHref}
                    aria-label="Bookmark (sign in first)"
                    className={verseActionClass}
                >
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                    <VerseActionLabel>Bookmark</VerseActionLabel>
                </Link>
            </Toolbar.Link>
        );
    }

    return (
        <VerseActionButton
            aria-pressed={bookmarked}
            onClick={onToggle}
            className={cn(bookmarked && "bg-reading-bg-subtle")}
        >
            <Bookmark
                className={cn("h-4 w-4", bookmarked && "fill-current")}
                aria-hidden="true"
            />
            <VerseActionLabel>Bookmark</VerseActionLabel>
        </VerseActionButton>
    );
}
