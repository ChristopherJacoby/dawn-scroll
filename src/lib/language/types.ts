/** Original-language (Hebrew/Greek) types shared by the import and the UI. */

export type OriginalLanguage = "hebrew" | "greek";

/** A Strong's dictionary entry, keyed by its number (e.g. "G3056"). */
export interface StrongsEntry {
    number: string;
    language: OriginalLanguage;
    /** Dictionary form in Hebrew or Greek script. */
    lemma: string;
    transliteration: string;
    pronunciation: string | null;
    derivation: string | null;
    definition: string;
    /** How the KJV renders the word, per Strong's. */
    kjvUsage: string | null;
    /** Dawnscroll's note on how the English rendering differs, if any. */
    driftNote: string | null;
}

/** One grammatical feature of a word, e.g. { name: "Case", value: "Nominative" }. */
export interface MorphologicalFeature {
    name: string;
    value: string;
}

/** A morphology code (Robinson for Greek, OSHB for Hebrew) and its expansion. */
export interface MorphologicalTag {
    code: string;
    language: OriginalLanguage;
    features: MorphologicalFeature[];
}

/**
 * A word of the original text in one verse, as stored (compact keys keep
 * ~440k words small): w = word as written, x = transliteration, s = main
 * Strong's number, m = morphology code of the main part, g = English gloss
 * in context.
 */
export interface OriginalWord {
    w: string;
    x: string;
    s: string;
    m: string | null;
    g: string;
}

/**
 * How one display token of a translation's verse maps to the original:
 * s = Strong's number, o = index into the verse's original words (null
 * when the tagged word couldn't be matched to one).
 */
export interface WordMapping {
    s: string;
    o: number | null;
}
