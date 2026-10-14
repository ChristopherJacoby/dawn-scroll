"use client";

import { useRef, useState } from "react";
import { StudyWord, WordStudyCard } from "@/components/reader/WordStudy";
import { useToast } from "@/context/toast";
import type { VerseWordStudy } from "@/lib/language/queries";
import { tokenizeVerse } from "@/lib/language/text";

interface UseWordStudyOptions {
    bookSlug: string;
    chapterNumber: number;
    translation: string;
}

/**
 * Word study for one verse at a time: fetches the verse's original-language
 * data on first use (cached per verse), tracks which word's card is open,
 * and renders the verse text with tappable words.
 */
export function useWordStudy({
    bookSlug,
    chapterNumber,
    translation,
}: UseWordStudyOptions) {
    const toast = useToast();
    const [verse, setVerse] = useState<number | null>(null);
    const [studies, setStudies] = useState<Record<number, VerseWordStudy>>({});
    const [loading, setLoading] = useState<number | null>(null);
    const [openToken, setOpenToken] = useState<number | null>(null);
    const requested = useRef(new Set<number>());

    function stop() {
        setVerse(null);
        setOpenToken(null);
    }

    async function toggle(target: number) {
        if (verse === target) return stop();
        setVerse(target);
        setOpenToken(null);
        if (requested.current.has(target)) return;
        requested.current.add(target);
        setLoading(target);
        try {
            const params = new URLSearchParams({
                book: bookSlug,
                chapter: String(chapterNumber),
                verse: String(target),
                translation,
            });
            const response = await fetch(`/api/language/verse?${params}`);
            if (!response.ok) throw new Error(String(response.status));
            const { study } = (await response.json()) as {
                study: VerseWordStudy;
            };
            setStudies((current) => ({ ...current, [target]: study }));
        } catch {
            requested.current.delete(target);
            toast.error("Couldn't load the original words. Please try again.");
            setVerse((current) => (current === target ? null : current));
        } finally {
            setLoading((current) => (current === target ? null : current));
        }
    }

    /** The verse text with tappable words, or undefined when not studying it. */
    function render(target: number, text: string): React.ReactNode {
        const study = verse === target ? studies[target] : undefined;
        if (!study) return undefined;
        const hebrew = study.tokens.some((t) => t?.s.startsWith("H"));
        return (
            <>
                {tokenizeVerse(text).map((token, index) => {
                    const mapping = study.tokens[index];
                    const separator = index > 0 ? " " : "";
                    if (!mapping) return separator + token;
                    const word =
                        mapping.o === null ? null : study.words[mapping.o];
                    return (
                        <span key={index}>
                            {separator}
                            <StudyWord
                                token={token}
                                open={openToken === index}
                                onOpenChange={(open) =>
                                    setOpenToken(open ? index : null)
                                }
                                card={() => (
                                    <WordStudyCard
                                        mapping={mapping}
                                        word={word ?? null}
                                        entry={study.entries[mapping.s] ?? null}
                                        features={
                                            word?.m
                                                ? (study.morphology[word.m] ??
                                                  null)
                                                : null
                                        }
                                    />
                                )}
                            />
                        </span>
                    );
                })}
                <span className="mt-1 block font-sans text-xs text-reading-text-muted">
                    Tap an underlined word to see the{" "}
                    {hebrew ? "Hebrew" : "Greek"} behind it.
                </span>
            </>
        );
    }

    return {
        /** The verse being studied (even while its data loads), or null. */
        verse,
        isLoading: (target: number) => loading === target,
        toggle,
        stop,
        render,
    };
}
