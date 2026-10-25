import type { QuestionQuote } from "@/lib/questions/types";

/** A short quote, attributed and linked to the source it comes from. */
export function PullQuote({ quote }: { quote: QuestionQuote }) {
    return (
        <figure className="flex flex-col gap-2 border-l-2 border-reading-accent pl-5 break-inside-avoid">
            <blockquote className="font-serif text-xl leading-relaxed text-reading-text">
                &ldquo;{quote.quote}&rdquo;
            </blockquote>
            <figcaption className="text-sm text-reading-text-muted">
                <span className="font-medium text-reading-text">
                    {quote.speaker}
                </span>
                , {quote.role}{" "}
                <a
                    href={`#source-${quote.source}`}
                    className="text-reading-link"
                >
                    [<span className="sr-only">source </span>
                    {quote.source}]
                </a>
            </figcaption>
        </figure>
    );
}
