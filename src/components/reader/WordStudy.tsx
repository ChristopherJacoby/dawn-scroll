"use client";

import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { summarizeMorphology } from "@/lib/language/morphology";
import { displayStrongs } from "@/lib/language/text";
import type {
    MorphologicalFeature,
    OriginalWord,
    StrongsEntry,
    WordMapping,
} from "@/lib/language/types";

/** Leading punctuation, the word, trailing punctuation: "(Word," → ["(", "Word", ","]. */
function splitPunctuation(token: string): [string, string, string] {
    const match = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(token);
    return match ? [match[1], match[2], match[3]] : ["", token, ""];
}

interface StudyWordProps {
    token: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The card, rendered only while open. */
    card: () => React.ReactNode;
}

/** A tappable word in word-study mode; opens its card in a popover. */
export function StudyWord({ token, open, onOpenChange, card }: StudyWordProps) {
    const [lead, word, trail] = splitPunctuation(token);
    return (
        <>
            {lead}
            <Popover.Root open={open} onOpenChange={onOpenChange}>
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "rounded-sm underline decoration-dotted decoration-2 underline-offset-[0.3em] decoration-[var(--reading-link)] transition-colors",
                            "hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                            open && "bg-reading-bg-subtle",
                        )}
                    >
                        {word}
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        side="top"
                        align="center"
                        sideOffset={6}
                        collisionPadding={12}
                        className="z-30 max-h-[min(28rem,60vh)] overflow-y-auto rounded-lg border border-reading-border-strong bg-reading-surface-raised font-sans text-reading-text shadow-lg focus:outline-none"
                    >
                        {card()}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
            {trail}
        </>
    );
}

interface OriginalWordChipProps {
    word: OriginalWord;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The card, rendered only while open. */
    card: () => React.ReactNode;
}

/**
 * One of a verse's original words, with its in-context gloss; opens its
 * card. For translations whose words aren't linked to the original.
 */
export function OriginalWordChip({
    word,
    open,
    onOpenChange,
    card,
}: OriginalWordChipProps) {
    const hebrew = word.s.startsWith("H");
    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex flex-col items-center gap-0.5 rounded-md border border-reading-border px-2 py-1 transition-colors",
                        "hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                        open && "bg-reading-bg-subtle",
                    )}
                >
                    <span
                        lang={hebrew ? "he" : "grc"}
                        dir={hebrew ? "rtl" : "ltr"}
                        className={cn(
                            hebrew ? "font-hebrew" : "font-greek",
                            "text-xl leading-tight text-reading-text",
                        )}
                    >
                        {word.w}
                    </span>
                    <span className="font-sans text-xs text-reading-text-muted">
                        {word.g}
                    </span>
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side="top"
                    align="center"
                    sideOffset={6}
                    collisionPadding={12}
                    className="z-30 max-h-[min(28rem,60vh)] overflow-y-auto rounded-lg border border-reading-border-strong bg-reading-surface-raised font-sans text-reading-text shadow-lg focus:outline-none"
                >
                    {card()}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}

interface WordStudyCardProps {
    mapping: WordMapping;
    word: OriginalWord | null;
    entry: StrongsEntry | null;
    features: MorphologicalFeature[] | null;
}

/** Original word, transliteration, grammar, gloss, and Strong's entry. */
export function WordStudyCard({
    mapping,
    word,
    entry,
    features,
}: WordStudyCardProps) {
    const hebrew = mapping.s.startsWith("H");
    const script = hebrew ? "font-hebrew" : "font-greek";
    const lang = hebrew ? "he" : "grc";
    const dir = hebrew ? "rtl" : "ltr";
    const shown = word?.w ?? entry?.lemma ?? "";

    return (
        <div className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <p
                        lang={lang}
                        dir={dir}
                        className={cn(script, "text-3xl leading-tight")}
                    >
                        {shown}
                    </p>
                    <p className="text-sm text-reading-text-muted">
                        {word?.x || entry?.transliteration}
                    </p>
                </div>
                <span className="rounded bg-reading-bg-subtle px-1.5 py-0.5 text-xs font-semibold tabular-nums text-reading-text-muted">
                    {displayStrongs(mapping.s)}
                </span>
            </div>

            {(features?.length || word?.g) && (
                <dl className="flex flex-col gap-1 text-sm">
                    {features && features.length > 0 && (
                        <div>
                            <dt className="sr-only">Grammar</dt>
                            <dd>{summarizeMorphology(features)}</dd>
                        </div>
                    )}
                    {word?.g && (
                        <div className="text-reading-text-muted">
                            <dt className="inline">In this verse: </dt>
                            <dd className="inline text-reading-text">
                                &ldquo;{word.g}&rdquo;
                            </dd>
                        </div>
                    )}
                </dl>
            )}

            {entry?.driftNote && (
                <div className="flex flex-col gap-1 rounded-md border-l-2 border-reading-accent bg-reading-bg-subtle px-3 py-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-reading-text-muted">
                        Translation note
                    </p>
                    <p className="leading-relaxed">{entry.driftNote}</p>
                </div>
            )}

            {entry ? (
                <div className="flex flex-col gap-2 border-t border-reading-divider pt-3 text-sm">
                    {entry.lemma !== shown && (
                        <p className="text-reading-text-muted">
                            Dictionary form{" "}
                            <span
                                lang={lang}
                                dir={dir}
                                className={cn(
                                    script,
                                    "text-base text-reading-text",
                                )}
                            >
                                {entry.lemma}
                            </span>{" "}
                            ({entry.transliteration})
                        </p>
                    )}
                    <p className="leading-relaxed">{entry.definition}</p>
                    {entry.derivation && (
                        <p className="text-xs text-reading-text-muted">
                            {entry.derivation}
                        </p>
                    )}
                    {entry.kjvUsage && (
                        <p className="text-xs text-reading-text-muted">
                            <span className="font-medium">KJV renders it:</span>{" "}
                            {entry.kjvUsage}
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-reading-text-muted">
                    No dictionary entry for this word.
                </p>
            )}

            <Link
                href="/credits"
                className="self-start text-xs text-reading-link"
            >
                Sources
            </Link>
        </div>
    );
}
