/**
 * The chat wire format, shared by the API routes and the chat UI. The
 * response is NDJSON: one ChatStreamEvent per line.
 */

export interface ChatTurn {
    role: "user" | "assistant";
    content: string;
}

/** Where the reader is: a book slug, chapter and optional verse. */
export interface PassageRef {
    book: string;
    chapter: number;
    verse?: number;
}

export interface ChatRequestBody {
    messages: ChatTurn[];
    passage?: PassageRef;
}

export type ChatStreamEvent =
    /** First event: questions left today, including this one's deduction. */
    | { type: "meta"; remaining: number; limit: number }
    | { type: "text"; text: string }
    | { type: "done"; truncated: boolean }
    | { type: "error"; message: string };

export const CHAT_LIMITS = {
    /** A user message. */
    questionChars: 2000,
    /** A reply carried in the history; longer ones are cut. */
    replyChars: 16000,
    /**
     * Everything sent, after trimming to the recent history. Counted in
     * UTF-8 bytes, which tracks tokens better than characters do for
     * non-Latin scripts.
     */
    totalBytes: 40000,
    /** Messages in a request body, before trimming. */
    messages: 200,
};

const encoder = new TextEncoder();

export type ParsedChatBody =
    | { ok: true; turns: ChatTurn[]; passage: PassageRef | null }
    | { ok: false; error: string };

function isPositiveInt(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function parsePassage(value: unknown): PassageRef | null | undefined {
    if (value === undefined || value === null) return null;
    const p = value as Partial<PassageRef>;
    if (
        typeof p.book !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.book) ||
        !isPositiveInt(p.chapter) ||
        (p.verse !== undefined && !isPositiveInt(p.verse))
    ) {
        return undefined;
    }
    return {
        book: p.book,
        chapter: p.chapter,
        ...(p.verse && { verse: p.verse }),
    };
}

/**
 * Validates a chat request body and trims it to the most recent
 * `maxTurns` messages, starting on a user turn. The last message must be
 * the user's new question.
 */
export function parseChatBody(body: unknown, maxTurns: number): ParsedChatBody {
    const { messages, passage } = (body ?? {}) as Partial<
        Record<keyof ChatRequestBody, unknown>
    >;
    if (
        !Array.isArray(messages) ||
        messages.length === 0 ||
        messages.length > CHAT_LIMITS.messages
    ) {
        return {
            ok: false,
            error: "Send the conversation as a list of messages.",
        };
    }
    const turns: ChatTurn[] = [];
    for (const m of messages as Partial<ChatTurn>[]) {
        if (
            (m?.role !== "user" && m?.role !== "assistant") ||
            typeof m.content !== "string"
        ) {
            return { ok: false, error: "Each message needs a role and text." };
        }
        if (m.role === "user") {
            // The app never sends a longer question, so the history is
            // either from another client or forged.
            if (m.content.length > CHAT_LIMITS.questionChars) {
                return {
                    ok: false,
                    error: `Keep questions under ${CHAT_LIMITS.questionChars} characters.`,
                };
            }
            turns.push({ role: "user", content: m.content });
        } else if (m.content.trim()) {
            // (A reply stopped before any text arrived carries nothing.)
            turns.push({
                role: "assistant",
                content: m.content.slice(0, CHAT_LIMITS.replyChars),
            });
        }
    }
    const question = turns.at(-1);
    if (question?.role !== "user" || !question.content.trim()) {
        return { ok: false, error: "Ask a question." };
    }
    let recent = turns.slice(-maxTurns);
    while (recent[0].role !== "user") recent = recent.slice(1);
    // Drop the oldest turns until the history fits.
    const size = (t: ChatTurn) => encoder.encode(t.content).length;
    let total = recent.reduce((sum, t) => sum + size(t), 0);
    while (total > CHAT_LIMITS.totalBytes && recent.length > 1) {
        total -= size(recent[0]);
        recent = recent.slice(1);
        while (recent[0].role !== "user") {
            total -= size(recent[0]);
            recent = recent.slice(1);
        }
    }
    const parsedPassage = parsePassage(passage);
    if (parsedPassage === undefined)
        return { ok: false, error: "That passage isn't valid." };
    return { ok: true, turns: recent, passage: parsedPassage };
}
