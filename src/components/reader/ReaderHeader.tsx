"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface ReaderHeaderProps {
    reference: string;
    translationName: string;
    /** Buttons beside the title (Ask, reading mode). */
    actions: React.ReactNode;
    /** Book, chapter and translation pickers. */
    pickers: React.ReactNode;
}

/**
 * The reader's title bar. On phones the pickers fold away behind the
 * title ("Psalm 23 ▾") so the text starts near the top of the screen;
 * from md up they're always shown. Keyed by chapter, so it closes after
 * a pick.
 */
export function ReaderHeader({
    reference,
    translationName,
    actions,
    pickers,
}: ReaderHeaderProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 py-4 md:gap-6 md:px-10 md:py-8">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1 md:gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        {translationName}
                    </p>
                    <h1 className="font-serif text-3xl leading-tight text-reading-text md:text-5xl">
                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            aria-expanded={open}
                            aria-controls="reader-pickers"
                            className="inline-flex items-center gap-1.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus md:hidden"
                        >
                            {reference}
                            <ChevronDown
                                className={cn(
                                    "h-5 w-5 shrink-0 text-reading-text-muted transition-transform",
                                    open && "rotate-180",
                                )}
                                aria-hidden="true"
                            />
                            <span className="sr-only">
                                : choose book, chapter or translation
                            </span>
                        </button>
                        <span className="hidden md:inline">{reference}</span>
                    </h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                </div>
            </div>
            <div
                id="reader-pickers"
                className={cn(open ? "block" : "hidden", "md:block")}
            >
                {pickers}
            </div>
        </div>
    );
}
