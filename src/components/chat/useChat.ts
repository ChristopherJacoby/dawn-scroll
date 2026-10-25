"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatStreamEvent, ChatTurn, PassageRef } from "@/lib/ai/chat";
import { readNdjson } from "@/lib/chat/ndjson";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    /** Replies only: streaming until the answer ends one way or another. */
    status?: "streaming" | "done" | "stopped" | "error";
    error?: string;
    /** Whether trying again could help (not for daily-limit errors). */
    retryable?: boolean;
    /** The answer hit the length limit. */
    truncated?: boolean;
}

export interface Quota {
    remaining: number;
    limit: number;
}

interface ChatState {
    messages: ChatMessage[];
    passage: PassageRef | null;
}

const samePassage = (a: PassageRef | null, b: PassageRef | null) =>
    a?.book === b?.book && a?.chapter === b?.chapter && a?.verse === b?.verse;

/**
 * The saved conversation, if it can continue here. Arriving with a
 * different passage (from the reader) starts fresh about that passage.
 */
function initialState(
    storageKey: string,
    passage: PassageRef | null,
): ChatState {
    let stored: ChatState | null = null;
    try {
        stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    } catch {
        // Storage unavailable or corrupt: start fresh.
    }
    if (
        !Array.isArray(stored?.messages) ||
        (passage && !samePassage(stored.passage, passage))
    ) {
        return { messages: [], passage };
    }
    return {
        passage: stored!.passage,
        // A reply cut off by leaving the page can't resume.
        messages: stored!.messages.map((m) =>
            m.status === "streaming" ? { ...m, status: "stopped" } : m,
        ),
    };
}

let idCounter = 0;
/** Unique within the tab; crypto.randomUUID needs HTTPS, which a phone on
 * a LAN dev server lacks. */
const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/** Quota days are UTC, like the server's. */
const today = () => new Date().toISOString().slice(0, 10);

/**
 * The server's count, unless this tab has seen a lower one today under
 * the same limit: the page's props can be a cached render after back
 * navigation.
 */
function initialQuotaState(
    storageKey: string,
    server: Quota | null,
): Quota | null {
    try {
        const stored = JSON.parse(
            sessionStorage.getItem(`${storageKey}.quota`) ?? "null",
        ) as (Quota & { day: string }) | null;
        if (
            stored?.day === today() &&
            (!server ||
                (stored.limit === server.limit &&
                    stored.remaining < server.remaining))
        ) {
            return { remaining: stored.remaining, limit: stored.limit };
        }
    } catch {
        // Fall back to the server's count.
    }
    return server;
}

/** Whether a reply can be asked again: it failed retryably or was stopped. */
export function canRetry(message: ChatMessage | undefined): boolean {
    return (
        message?.role === "assistant" &&
        (message.status === "stopped" ||
            (message.status === "error" && message.retryable === true))
    );
}

/** What the API needs: role and text, without replies that failed empty. */
function toTurns(messages: ChatMessage[]): ChatTurn[] {
    return messages
        .filter((m) => m.role === "user" || m.content)
        .map(({ role, content }) => ({ role, content }));
}

/**
 * A streamed AI conversation against an /api/chat/* route. Kept in
 * sessionStorage, so following a verse link and coming back picks up
 * where the reader left off. Render client-only: the initial state reads
 * storage.
 */
export function useChat({
    endpoint,
    storageKey,
    extraBody,
    passage,
    initialQuota,
}: {
    endpoint: string;
    storageKey: string;
    /** Sent with every request, e.g. `{ figureId }`. */
    extraBody?: Record<string, unknown>;
    passage: PassageRef | null;
    initialQuota: Quota | null;
}) {
    const [chat, setChat] = useState(() => initialState(storageKey, passage));
    const [quota, setQuota] = useState(() =>
        initialQuotaState(storageKey, initialQuota),
    );
    const abortRef = useRef<AbortController | null>(null);
    const streaming = chat.messages.at(-1)?.status === "streaming";

    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(chat));
        } catch {
            // Not saved; the conversation still works on this page.
        }
    }, [chat, storageKey]);

    useEffect(() => {
        try {
            if (quota) {
                sessionStorage.setItem(
                    `${storageKey}.quota`,
                    JSON.stringify({ ...quota, day: today() }),
                );
            }
        } catch {
            // Not saved.
        }
    }, [quota, storageKey]);

    // Leaving the page cancels the request, which stops the server too.
    useEffect(() => () => abortRef.current?.abort(), []);

    const run = useCallback(
        async (history: ChatMessage[], passage: PassageRef | null) => {
            const replyId = newId();
            const update = (patch: (m: ChatMessage) => Partial<ChatMessage>) =>
                setChat((c) => ({
                    ...c,
                    messages: c.messages.map((m) =>
                        m.id === replyId ? { ...m, ...patch(m) } : m,
                    ),
                }));
            setChat((c) => ({
                ...c,
                messages: [
                    ...history,
                    {
                        id: replyId,
                        role: "assistant",
                        content: "",
                        status: "streaming",
                    },
                ],
            }));
            const controller = new AbortController();
            abortRef.current = controller;
            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...extraBody,
                        messages: toTurns(history),
                        ...(passage && { passage }),
                    }),
                    signal: controller.signal,
                });
                if (!response.ok || !response.body) {
                    const body = (await response.json().catch(() => null)) as {
                        error?: string;
                        retryable?: boolean;
                    } | null;
                    if (response.status === 429) {
                        setQuota((q) => (q ? { ...q, remaining: 0 } : q));
                    }
                    update(() => ({
                        status: "error",
                        error:
                            body?.error ?? "Something went wrong. Try again.",
                        retryable:
                            response.status >= 500 && body?.retryable !== false,
                    }));
                    return;
                }
                for await (const event of readNdjson<ChatStreamEvent>(
                    response.body,
                )) {
                    if (event.type === "meta") {
                        setQuota({
                            remaining: event.remaining,
                            limit: event.limit,
                        });
                    } else if (event.type === "text") {
                        update((m) => ({ content: m.content + event.text }));
                    } else if (event.type === "done") {
                        update(() => ({
                            status: "done",
                            truncated: event.truncated,
                        }));
                    } else {
                        update(() => ({
                            status: "error",
                            error: event.message,
                            retryable: event.retryable,
                        }));
                    }
                }
                // The stream ended without a final event: the connection dropped.
                update((m) =>
                    m.status === "streaming"
                        ? {
                              status: "error",
                              error: "The answer was cut off. Try again.",
                              retryable: true,
                          }
                        : {},
                );
            } catch {
                update((m) =>
                    m.status !== "streaming"
                        ? {}
                        : controller.signal.aborted
                          ? { status: "stopped" }
                          : {
                                status: "error",
                                error: "Couldn't reach Dawnscroll. Check your connection and try again.",
                                retryable: true,
                            },
                );
            } finally {
                if (abortRef.current === controller) abortRef.current = null;
            }
        },
        [endpoint, extraBody],
    );

    /** Asks a question; false when it can't be sent right now. */
    const send = useCallback(
        (text: string) => {
            const content = text.trim();
            if (!content || streaming) return false;
            void run(
                [...chat.messages, { id: newId(), role: "user", content }],
                chat.passage,
            );
            return true;
        },
        [chat, run, streaming],
    );

    /** Asks the last question again, after a failed or stopped answer. */
    const retry = useCallback(() => {
        const last = chat.messages.at(-1);
        if (streaming || !canRetry(last)) return;
        void run(chat.messages.slice(0, -1), chat.passage);
    }, [chat, run, streaming]);

    const stop = useCallback(() => abortRef.current?.abort(), []);

    /** Clears the conversation, keeping the passage. */
    const reset = useCallback(() => {
        abortRef.current?.abort();
        setChat((c) => ({ messages: [], passage: c.passage }));
    }, []);

    const clearPassage = useCallback(
        () => setChat((c) => ({ ...c, passage: null })),
        [],
    );

    return {
        messages: chat.messages,
        passage: chat.passage,
        quota,
        streaming,
        send,
        retry,
        stop,
        reset,
        clearPassage,
    };
}
