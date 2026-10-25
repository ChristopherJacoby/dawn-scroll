import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { type Inline, parseMarkdown } from "@/lib/chat/markdown";

function Inlines({ nodes }: { nodes: Inline[] }) {
    return nodes.map((node, i) => {
        switch (node.type) {
            case "text":
                return node.text;
            case "strong":
                return (
                    <strong key={i} className="font-semibold">
                        <Inlines nodes={node.children} />
                    </strong>
                );
            case "em":
                return (
                    <em key={i}>
                        <Inlines nodes={node.children} />
                    </em>
                );
            case "code":
                return (
                    <code
                        key={i}
                        className="rounded bg-reading-bg-subtle px-1 font-mono text-[0.9em]"
                    >
                        {node.text}
                    </code>
                );
            case "verse":
                return (
                    <Link
                        key={i}
                        href={node.href}
                        className="text-reading-link underline decoration-reading-border-strong underline-offset-2 hover:decoration-current"
                    >
                        {node.text}
                    </Link>
                );
            case "link":
                return (
                    <Link
                        key={i}
                        href={node.href}
                        className="text-reading-link underline underline-offset-2"
                    >
                        <Inlines nodes={node.children} />
                    </Link>
                );
        }
    });
}

/**
 * Apostle replies end with a "Read: John 21:15-19, ..." line: the app's
 * note to the reader rather than the apostle's speech.
 */
function isReadingNote(nodes: Inline[]): boolean {
    const first = nodes[0];
    return first?.type === "text" && first.text.startsWith("Read:");
}

/** An AI answer's markdown, with Bible references linked to the reader. */
export function ChatMarkdown({
    source,
    className,
}: {
    source: string;
    className?: string;
}) {
    const blocks = useMemo(() => parseMarkdown(source), [source]);
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {blocks.map((block, i) => {
                switch (block.type) {
                    case "paragraph":
                        return (
                            <p
                                key={i}
                                className={cn(
                                    "whitespace-pre-line",
                                    isReadingNote(block.children) &&
                                        "text-sm text-reading-text-muted",
                                )}
                            >
                                <Inlines nodes={block.children} />
                            </p>
                        );
                    case "heading":
                        return (
                            <p key={i} className="font-semibold">
                                <Inlines nodes={block.children} />
                            </p>
                        );
                    case "quote":
                        return (
                            <blockquote
                                key={i}
                                className="whitespace-pre-line border-l-2 border-reading-border-strong pl-4 font-serif italic text-reading-text-muted"
                            >
                                <Inlines nodes={block.children} />
                            </blockquote>
                        );
                    case "list": {
                        const List = block.ordered ? "ol" : "ul";
                        return (
                            <List
                                key={i}
                                start={
                                    block.ordered && block.start !== 1
                                        ? block.start
                                        : undefined
                                }
                                className={cn(
                                    "flex flex-col gap-1.5 pl-5",
                                    block.ordered
                                        ? "list-decimal"
                                        : "list-disc",
                                )}
                            >
                                {block.items.map((item, j) => (
                                    <li key={j}>
                                        <Inlines nodes={item} />
                                    </li>
                                ))}
                            </List>
                        );
                    }
                }
            })}
        </div>
    );
}
