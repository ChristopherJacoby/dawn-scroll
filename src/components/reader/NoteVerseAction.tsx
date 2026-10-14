"use client";

import * as Toolbar from "@radix-ui/react-toolbar";
import { NotebookPen } from "lucide-react";
import Link from "next/link";
import {
    VerseActionButton,
    VerseActionLabel,
    verseActionClass,
} from "@/components/reader/VerseActionBar";
import { cn } from "@/lib/cn";

interface NoteVerseActionProps {
    hasNote: boolean;
    onOpen: () => void;
    /** Where to send signed-out readers; null when signed in. */
    signInHref: string | null;
}

export function NoteVerseAction({
    hasNote,
    onOpen,
    signInHref,
}: NoteVerseActionProps) {
    if (signInHref) {
        return (
            <Toolbar.Link asChild>
                <Link
                    href={signInHref}
                    aria-label="Note (sign in first)"
                    className={verseActionClass}
                >
                    <NotebookPen className="h-4 w-4" aria-hidden="true" />
                    <VerseActionLabel>Note</VerseActionLabel>
                </Link>
            </Toolbar.Link>
        );
    }

    return (
        <VerseActionButton
            onClick={onOpen}
            aria-haspopup="dialog"
            className={cn(hasNote && "bg-reading-bg-subtle")}
        >
            <NotebookPen className="h-4 w-4" aria-hidden="true" />
            <VerseActionLabel>
                {hasNote ? "Edit note" : "Note"}
            </VerseActionLabel>
        </VerseActionButton>
    );
}
