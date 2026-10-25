"use client";

import { useRef, useState } from "react";
import {
    OriginalWordChip,
    StudyWord,
    WordStudyCard,
} from "@/components/reader/WordStudy";
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

    /**
     * The verse text with tappable words (where they're linked to the
     * original) and a hint, or undefined.
     */
    function render(
        target: number,
        text: string,
    ):
        | { content: React.ReactNode; hint: string; below?: React.ReactNode }
        | undefined {
        const study = verse === target ? studies[target] : undefined;
        if (!study) return undefined;
        const hebrew = study.words[0]?.s.startsWith("H") ?? false;
        const language = hebrew ? "Hebrew" : "Greek";
        const hasLinks = study.tokens.some(Boolean);

        // Only the KJV's words are linked to the original; elsewhere, list
        // the verse's original words, in reading order, to tap instead.
        if (!hasLinks && study.words.length > 0) {
            return {
                content: text,
                hint: `This translation isn’t linked word by word, so here are the verse’s ${language} words. Tap one for its meaning.`,
                below: (
                    <div
                        dir={hebrew ? "rtl" : "ltr"}
                        className="flex flex-wrap gap-2"
                    >
                        {study.words.map((word, index) => {
                            // Distinct from token indexes, which are >= 0.
                            const key = -(index + 1);
                            return (
                                <OriginalWordChip
                                    key={index}
                                    word={word}
                                    open={openToken === key}
                                    onOpenChange={(open) =>
                                        setOpenToken(open ? key : null)
                                    }
                                    card={() => (
                                        <WordStudyCard
                                            mapping={{ s: word.s, o: index }}
                                            word={word}
                                            entry={
                                                study.entries[word.s] ?? null
                                            }
                                            features={
                                                word.m
                                                    ? (study.morphology[
                                                          word.m
                                                      ] ?? null)
                                                    : null
                                            }
                                        />
                                    )}
                                />
                            );
                        })}
                    </div>
                ),
            };
        }
        const content = tokenizeVerse(text).map((token, index) => {
            const mapping = study.tokens[index];
            const separator = index > 0 ? " " : "";
            if (!mapping) return separator + token;
            const word = mapping.o === null ? null : study.words[mapping.o];
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
                                        ? (study.morphology[word.m] ?? null)
                                        : null
                                }
                            />
                        )}
                    />
                </span>
            );
        });
        return {
            content,
            hint: hasLinks
                ? `Tap an underlined word to see the ${language} behind it.`
                : `No words in this verse are linked to the ${language} yet.`,
        };
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
