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
    /** Everything sent, after trimming to the recent history. */
    totalChars: 40000,
    /** Messages in a request body, before trimming. */
    messages: 200,
};

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
        // A reply stopped before any text arrived carries nothing.
        if (m.role === "assistant" && !m.content.trim()) continue;
        turns.push({ role: m.role, content: m.content });
    }
    const question = turns.at(-1);
    if (question?.role !== "user" || !question.content.trim()) {
        return { ok: false, error: "Ask a question." };
    }
    if (question.content.length > CHAT_LIMITS.questionChars) {
        return {
            ok: false,
            error: `Keep questions under ${CHAT_LIMITS.questionChars} characters.`,
        };
    }
    let recent = turns.slice(-maxTurns);
    while (recent[0].role !== "user") recent = recent.slice(1);
    // Drop the oldest turns until the history fits.
    let total = recent.reduce((sum, t) => sum + t.content.length, 0);
    while (total > CHAT_LIMITS.totalChars && recent.length > 1) {
        total -= recent[0].content.length;
        recent = recent.slice(1);
        while (recent[0].role !== "user") {
            total -= recent[0].content.length;
            recent = recent.slice(1);
        }
    }
    const parsedPassage = parsePassage(passage);
    if (parsedPassage === undefined)
        return { ok: false, error: "That passage isn't valid." };
    return { ok: true, turns: recent, passage: parsedPassage };
}
