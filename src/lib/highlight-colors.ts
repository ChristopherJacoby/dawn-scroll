/** Highlight palette keys; each reading mode defines its own shade. */
export const HIGHLIGHT_COLORS = [
    "yellow",
    "green",
    "blue",
    "pink",
    "purple",
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const HIGHLIGHT_LABELS: Record<HighlightColor, string> = {
    yellow: "Yellow",
    green: "Green",
    blue: "Blue",
    pink: "Pink",
    purple: "Purple",
};

/** Full class names (not built from the key) so Tailwind can find them. */
export const HIGHLIGHT_BG: Record<HighlightColor, string> = {
    yellow: "bg-highlight-yellow",
    green: "bg-highlight-green",
    blue: "bg-highlight-blue",
    pink: "bg-highlight-pink",
    purple: "bg-highlight-purple",
};

export function isHighlightColor(value: unknown): value is HighlightColor {
    return (HIGHLIGHT_COLORS as readonly unknown[]).includes(value);
}
