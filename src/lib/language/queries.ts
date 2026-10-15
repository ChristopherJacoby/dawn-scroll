import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import type { VerseRefInput } from "@/lib/verse-ref";
import type {
    MorphologicalFeature,
    OriginalLanguage,
    OriginalWord,
    StrongsEntry,
    WordMapping,
} from "./types";

/** Everything the reader needs to study one verse's words. */
export interface VerseWordStudy {
    /** Per display token of the verse text: its mapping, or null. */
    tokens: (WordMapping | null)[];
    /** The verse's Hebrew/Greek words, in order. */
    words: OriginalWord[];
    /** Strong's entries for every number in `tokens`. */
    entries: Record<string, StrongsEntry>;
    /** Expanded morphology for every code in `words`. */
    morphology: Record<string, MorphologicalFeature[]>;
}

interface StrongsRow {
    number: string;
    language: OriginalLanguage;
    lemma: string;
    transliteration: string;
    pronunciation: string | null;
    derivation: string | null;
    definition: string;
    kjv_usage: string | null;
}

const STRONGS_COLUMNS =
    "number, language, lemma, transliteration, pronunciation, derivation, definition, kjv_usage";

function mapEntry(row: StrongsRow, driftNote: string | null): StrongsEntry {
    return {
        number: row.number,
        language: row.language,
        lemma: row.lemma,
        transliteration: row.transliteration,
        pronunciation: row.pronunciation,
        derivation: row.derivation,
        definition: row.definition,
        kjvUsage: row.kjv_usage,
        driftNote,
    };
}

/**
 * Drift notes for the given numbers. They live in their own table because
 * the original-language import truncates and reloads strongs_entries.
 */
async function getDriftNotes(
    supabase: SupabaseClient,
    numbers: string[],
): Promise<Record<string, string>> {
    if (!numbers.length) return {};
    const { data, error } = await supabase
        .from("strongs_drift_notes")
        .select("number, note")
        .in("number", numbers);
    if (error) throw error;
    return Object.fromEntries(
        (data as { number: string; note: string }[]).map((row) => [
            row.number,
            row.note,
        ]),
    );
}

/** One Strong's entry by canonical number ("G3056"), or null. */
export async function getStrongsEntry(
    number: string,
): Promise<StrongsEntry | null> {
    const supabase = createPublicClient();
    const [{ data, error }, notes] = await Promise.all([
        supabase
            .from("strongs_entries")
            .select(STRONGS_COLUMNS)
            .eq("number", number)
            .maybeSingle(),
        getDriftNotes(supabase, [number]),
    ]);
    if (error) throw error;
    return data ? mapEntry(data as StrongsRow, notes[number] ?? null) : null;
}

/** Word study for a verse, or null when the verse doesn't exist. */
export async function getVerseWordStudy(
    ref: VerseRefInput,
): Promise<VerseWordStudy | null> {
    const supabase = createPublicClient();
    const { data: verse, error } = await supabase
        .from("verses")
        .select(
            "id, book_id, chapter_number, verse_number, books!inner(slug), translations!inner(slug)",
        )
        .eq("books.slug", ref.book)
        .eq("translations.slug", ref.translation)
        .eq("chapter_number", ref.chapter)
        .eq("verse_number", ref.verse)
        .maybeSingle();
    if (error) throw error;
    if (!verse) return null;

    const [map, originals] = await Promise.all([
        supabase
            .from("verse_word_map")
            .select("tokens")
            .eq("verse_id", verse.id)
            .maybeSingle(),
        supabase
            .from("verse_original_words")
            .select("words")
            .eq("book_id", verse.book_id)
            .eq("chapter_number", verse.chapter_number)
            .eq("verse_number", verse.verse_number)
            .maybeSingle(),
    ]);
    if (map.error) throw map.error;
    if (originals.error) throw originals.error;

    const tokens = (map.data?.tokens ?? []) as (WordMapping | null)[];
    const words = (originals.data?.words ?? []) as OriginalWord[];
    const numbers = [...new Set(tokens.flatMap((t) => (t ? [t.s] : [])))];
    const codes = [...new Set(words.flatMap((w) => (w.m ? [w.m] : [])))];

    const [entries, morphology, notes] = await Promise.all([
        numbers.length
            ? supabase
                  .from("strongs_entries")
                  .select(STRONGS_COLUMNS)
                  .in("number", numbers)
            : Promise.resolve({ data: [], error: null }),
        codes.length
            ? supabase
                  .from("morphology_codes")
                  .select("code, features")
                  .in("code", codes)
            : Promise.resolve({ data: [], error: null }),
        getDriftNotes(supabase, numbers),
    ]);
    if (entries.error) throw entries.error;
    if (morphology.error) throw morphology.error;

    return {
        tokens,
        words,
        entries: Object.fromEntries(
            (entries.data as StrongsRow[]).map((row) => [
                row.number,
                mapEntry(row, notes[row.number] ?? null),
            ]),
        ),
        morphology: Object.fromEntries(
            (
                morphology.data as {
                    code: string;
                    features: MorphologicalFeature[];
                }[]
            ).map((row) => [row.code, row.features]),
        ),
    };
}
