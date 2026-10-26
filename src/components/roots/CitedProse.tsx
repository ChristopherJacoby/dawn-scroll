import { splitCitations } from "@/lib/roots/citations";

/** Prose with its [n] markers rendered as links to the source list. */
export function CitedProse({ text }: { text: string }) {
    const segments = splitCitations(text);
    return segments.map((segment, i) => {
        if (!("cite" in segment)) {
            // A marker hugs the word before it: "small”[1]", not "small” [1]".
            const beforeCite = i + 1 < segments.length;
            return beforeCite ? segment.text.trimEnd() : segment.text;
        }
        return (
            <sup key={i} className="ml-px font-sans text-[0.7em]">
                <a
                    href={`#source-${segment.cite}`}
                    className="px-0.5 py-1 text-reading-link no-underline hover:underline"
                >
                    [<span className="sr-only">source </span>
                    {segment.cite}]
                </a>
            </sup>
        );
    });
}
