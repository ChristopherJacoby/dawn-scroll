"use client";

import * as Toolbar from "@radix-ui/react-toolbar";
import { ScrollText } from "lucide-react";
import Link from "next/link";
import {
    VerseActionLabel,
    verseActionClass,
} from "@/components/reader/VerseActionBar";

interface AskVerseActionProps {
    bookSlug: string;
    chapterNumber: number;
    verse: number;
}

/** Opens Scholar chat about the selected verse. */
export function AskVerseAction({
    bookSlug,
    chapterNumber,
    verse,
}: AskVerseActionProps) {
    const query = new URLSearchParams({
        book: bookSlug,
        chapter: String(chapterNumber),
        verse: String(verse),
    });
    return (
        <Toolbar.Link asChild>
            <Link href={`/scholar?${query}`} className={verseActionClass}>
                <ScrollText className="h-4 w-4" aria-hidden="true" />
                <VerseActionLabel>Ask</VerseActionLabel>
            </Link>
        </Toolbar.Link>
    );
}
