import type { MorphologicalFeature } from "./types.ts";

/**
 * Parse a STEPBible morphology expansion ("Function=Noun; Case=Nominative;
 * …") into features, dropping parenthetical asides.
 */
export function parseMorphologyExpansion(
    expansion: string,
): MorphologicalFeature[] {
    return expansion
        .split(";")
        .map((part) => part.split("="))
        .filter((pair) => pair.length === 2)
        .map(([name, value]) => ({
            name: name.trim(),
            value: value.replace(/\s*\(.*?\)\s*/g, " ").trim(),
        }))
        .filter((feature) => feature.name && feature.value);
}

/** "Noun · Nominative · Singular · Masculine" (Function first). */
export function summarizeMorphology(features: MorphologicalFeature[]): string {
    return features.map((feature) => feature.value).join(" · ");
}
