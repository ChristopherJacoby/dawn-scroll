import type { MorphologicalFeature } from "./types.ts";

/**
 * Parse a STEPBible morphology expansion ("Function=Noun; Case=Nominative;
 * …") into features, dropping parenthetical asides first: they hold their
 * own semicolons ("Stem=Qal (hence Action=Simple; Voice=Active)").
 */
export function parseMorphologyExpansion(
    expansion: string,
): MorphologicalFeature[] {
    let text = expansion;
    // Innermost first, so nested asides come out whole.
    for (let prev = ""; prev !== text; ) {
        prev = text;
        text = text.replace(/\s*\([^()]*\)/g, "");
    }
    return text
        .split(";")
        .map((part) => part.split("="))
        .filter((pair) => pair.length === 2)
        .map(([name, value]) => ({ name: name.trim(), value: value.trim() }))
        .filter((feature) => feature.name && feature.value);
}

/** "Noun · Nominative · Singular · Masculine" (Function first). */
export function summarizeMorphology(features: MorphologicalFeature[]): string {
    return features.map((feature) => feature.value).join(" · ");
}
