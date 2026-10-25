import { findVerseReferences } from "@/lib/bible/references";

/**
 * A small markdown subset for AI answers: paragraphs, lists, quotes,
 * bold, italics, inline code and links, with Bible references turned into
 * reader links. Output is a tree for React to render, never HTML, so a
 * reply can't inject markup. Unfinished syntax mid-stream shows as text.
 */

export type Inline =
    | { type: "text"; text: string }
    | { type: "strong" | "em"; children: Inline[] }
    | { type: "code"; text: string }
    | { type: "link"; href: string; children: Inline[] }
    | { type: "verse"; href: string; text: string };

export type Block =
    | { type: "paragraph"; children: Inline[] }
    | { type: "heading"; children: Inline[] }
    | { type: "quote"; children: Inline[] }
    | { type: "list"; ordered: boolean; start: number; items: Inline[][] };

// Groups: 1 strong, 2 em, 3 code, 4 link label, 5 link href.
const INLINE =
    /\*\*(.+?)\*\*|(?<![\w*])[*_]([^*_\s](?:[^*_]*[^*_\s])?)[*_](?![\w*])|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Dawnscroll pages an answer may link to. Anything else (other sites,
 * javascript: URLs, other app pages) stays text: the prompt asks for these
 * only, but a manipulated reply mustn't be able to plant a link.
 */
const LINKABLE =
    /^\/(read\/[\w-]+\/\d+(#verse-\d+)?|(archaeology|roots|questions)\/[\w-]+)$/;

/** Plain text, with Bible references split out as verse links. */
function withReferences(text: string): Inline[] {
    const out: Inline[] = [];
    let last = 0;
    for (const ref of findVerseReferences(text)) {
        if (ref.start > last)
            out.push({ type: "text", text: text.slice(last, ref.start) });
        out.push({
            type: "verse",
            href: ref.href,
            text: text.slice(ref.start, ref.end),
        });
        last = ref.end;
    }
    if (last < text.length) out.push({ type: "text", text: text.slice(last) });
    return out;
}

export function parseInline(text: string, linkReferences = true): Inline[] {
    const out: Inline[] = [];
    const plain = (s: string) => {
        if (s)
            out.push(
                ...(linkReferences
                    ? withReferences(s)
                    : [{ type: "text" as const, text: s }]),
            );
    };
    let last = 0;
    for (const match of text.matchAll(INLINE)) {
        const [, strong, em, code, label, href] = match;
        let node: Inline | null = null;
        if (strong !== undefined) {
            node = {
                type: "strong",
                children: parseInline(strong, linkReferences),
            };
        } else if (em !== undefined) {
            node = { type: "em", children: parseInline(em, linkReferences) };
        } else if (code !== undefined) {
            node = { type: "code", text: code };
        } else {
            // A link's label is never itself split into verse links.
            if (LINKABLE.test(href))
                node = {
                    type: "link",
                    href,
                    children: parseInline(label, false),
                };
        }
        if (!node) continue;
        plain(text.slice(last, match.index));
        out.push(node);
        last = match.index + match[0].length;
    }
    plain(text.slice(last));
    return out;
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export function parseMarkdown(source: string): Block[] {
    const blocks: Block[] = [];
    let paragraph: string[] = [];
    let list: { ordered: boolean; start: number; items: string[] } | null =
        null;

    const flush = () => {
        if (paragraph.length) {
            blocks.push({
                type: "paragraph",
                children: parseInline(paragraph.join("\n")),
            });
            paragraph = [];
        }
        if (list) {
            blocks.push({
                type: "list",
                ordered: list.ordered,
                start: list.start,
                items: list.items.map((item) => parseInline(item)),
            });
            list = null;
        }
    };

    for (const line of source.split("\n")) {
        if (!line.trim()) {
            flush();
            continue;
        }
        const bullet = BULLET.test(line);
        const numbered = !bullet && NUMBERED.test(line);
        if (bullet || numbered) {
            if (paragraph.length || (list && list.ordered !== numbered))
                flush();
            list ??= {
                ordered: numbered,
                start: numbered ? parseInt(line.trim(), 10) : 1,
                items: [],
            };
            list.items.push(line.replace(bullet ? BULLET : NUMBERED, ""));
            continue;
        }
        if (list && /^\s{2,}\S/.test(line)) {
            // A wrapped list item.
            list.items[list.items.length - 1] += ` ${line.trim()}`;
            continue;
        }
        const heading = line.match(/^#{1,6}\s+(.*)$/);
        const quote = line.match(/^>\s?(.*)$/);
        if (heading || quote) {
            flush();
            blocks.push(
                heading
                    ? { type: "heading", children: parseInline(heading[1]) }
                    : { type: "quote", children: parseInline(quote![1]) },
            );
            continue;
        }
        if (list) flush();
        paragraph.push(line);
    }
    flush();
    return mergeNeighbors(blocks);
}

/**
 * Consecutive quote lines form one quote, and lists split only by blank
 * lines ("1. a", blank, "2. b") form one list.
 */
function mergeNeighbors(blocks: Block[]): Block[] {
    const out: Block[] = [];
    for (const block of blocks) {
        const previous = out.at(-1);
        if (block.type === "quote" && previous?.type === "quote") {
            previous.children.push(
                { type: "text", text: "\n" },
                ...block.children,
            );
        } else if (
            block.type === "list" &&
            previous?.type === "list" &&
            previous.ordered === block.ordered
        ) {
            previous.items.push(...block.items);
        } else {
            out.push(block);
        }
    }
    return out;
}
