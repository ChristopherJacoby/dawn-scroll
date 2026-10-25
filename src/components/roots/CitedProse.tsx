import { splitCitations } from "@/lib/roots/citations";

/** Prose with its [n] markers rendered as links to the source list. */
export function CitedProse({ text }: { text: string }) {
    return splitCitations(text).map((segment, i) =>
        "cite" in segment ? (
            <sup key={i} className="ml-px font-sans text-[0.7em]">
                <a
                    href={`#source-${segment.cite}`}
                    className="px-0.5 py-1 text-reading-link no-underline hover:underline"
                >
                    [<span className="sr-only">source </span>
                    {segment.cite}]
                </a>
            </sup>
        ) : (
            segment.text
        ),
    );
}
