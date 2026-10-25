"use client";

import { ArrowUp, BookOpen, Plus, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PassageRef } from "@/lib/ai/chat";
import { bookName } from "@/lib/bible/references";
import { AIMessage, UserMessage } from "./ChatMessages";
import { type Quota, useChat } from "./useChat";

const GENERAL_SUGGESTIONS = [
    "Who were the Pharisees?",
    "How did weddings work in first-century Judea?",
    "Who was Pontius Pilate?",
    "What was the Feast of Tabernacles?",
];

function passageLabel(passage: PassageRef): string {
    const name = bookName(passage.book) ?? passage.book;
    return `${name} ${passage.chapter}${passage.verse ? `:${passage.verse}` : ""}`;
}

/** Keeps the newest message in view unless the reader has scrolled up. */
function useStickToBottom(dependency: unknown) {
    const endRef = useRef<HTMLDivElement>(null);
    const stick = useRef(true);
    useEffect(() => {
        const onScroll = () => {
            stick.current =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 120;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        if (stick.current) endRef.current?.scrollIntoView({ block: "end" });
    }, [dependency]);
    return {
        endRef,
        /** Call when the reader acts, e.g. sends a question. */
        follow: () => {
            stick.current = true;
        },
    };
}

export function ScholarChat({
    passage: initialPassage,
    initialQuota,
}: {
    passage: PassageRef | null;
    initialQuota: Quota | null;
}) {
    const chat = useChat({
        endpoint: "/api/chat/scholar",
        storageKey: "dawnscroll.chat.scholar",
        passage: initialPassage,
        initialQuota,
    });
    const [draft, setDraft] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { endRef, follow } = useStickToBottom(chat.messages);
    const outOfQuestions = chat.quota?.remaining === 0;
    const label = chat.passage ? passageLabel(chat.passage) : null;

    function ask(text: string) {
        follow();
        if (chat.send(text)) setDraft("");
    }

    function clearPassage() {
        chat.clearPassage();
        // Drop the passage from the URL too, so coming back here doesn't
        // read it as a new passage and start over.
        window.history.replaceState(null, "", "/scholar");
    }

    const suggestions = label
        ? [
              `What's the historical background of ${label}?`,
              "What customs would the first readers have recognized here?",
              "Who are the people and places in this passage?",
          ]
        : GENERAL_SUGGESTIONS;

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <header className="border-b border-reading-divider bg-reading-surface">
                <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-4 px-5 py-6 md:px-10">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-serif text-3xl leading-tight text-reading-text md:text-4xl">
                            Scholar
                        </h1>
                        <p className="text-sm text-reading-text-muted">
                            The history and culture behind the Bible.
                        </p>
                    </div>
                    {chat.messages.length > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="shrink-0 whitespace-nowrap"
                            onClick={() => {
                                chat.reset();
                                inputRef.current?.focus();
                            }}
                        >
                            <Plus size={14} aria-hidden="true" />
                            New conversation
                        </Button>
                    )}
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 md:px-10">
                <div
                    className="flex flex-1 flex-col gap-8 py-8"
                    aria-live="polite"
                >
                    {chat.messages.length === 0 ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-reading-text">
                                {label
                                    ? `Ask about ${label}: its setting, customs, people and places.`
                                    : "Ask about the customs, laws, festivals, places and people of the biblical world. Answers start from Scripture and cite the passages they rely on."}
                            </p>
                            <ul className="flex flex-col gap-2">
                                {suggestions.map((s) => (
                                    <li key={s}>
                                        <button
                                            type="button"
                                            onClick={() => ask(s)}
                                            disabled={outOfQuestions}
                                            className="w-full rounded-lg border border-reading-border px-4 py-3 text-left text-sm text-reading-text transition-colors hover:bg-reading-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus disabled:opacity-50"
                                        >
                                            {s}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        chat.messages.map((message) =>
                            message.role === "user" ? (
                                <UserMessage
                                    key={message.id}
                                    message={message}
                                />
                            ) : (
                                <AIMessage
                                    key={message.id}
                                    message={message}
                                    speaker="Scholar"
                                    onRetry={chat.retry}
                                />
                            ),
                        )
                    )}
                    <div ref={endRef} />
                </div>

                <div className="sticky bottom-0 flex flex-col gap-2 bg-reading-bg pb-4 pt-2">
                    {label && (
                        <p className="flex items-center gap-2 self-start rounded-full border border-reading-border bg-reading-surface py-1 pl-3 pr-1 text-sm text-reading-text">
                            <BookOpen
                                size={14}
                                aria-hidden="true"
                                className="text-reading-text-muted"
                            />
                            Reading {label}
                            <button
                                type="button"
                                onClick={clearPassage}
                                aria-label={`Stop asking about ${label}`}
                                className="rounded-full p-1 text-reading-text-muted hover:bg-reading-bg-subtle hover:text-reading-text"
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        </p>
                    )}
                    <form
                        className="flex items-end gap-2 rounded-xl border border-reading-border-strong bg-reading-surface p-2 focus-within:ring-2 focus-within:ring-reading-focus"
                        onSubmit={(e) => {
                            e.preventDefault();
                            ask(draft);
                        }}
                    >
                        <label htmlFor="scholar-question" className="sr-only">
                            Ask the Scholar
                        </label>
                        <textarea
                            id="scholar-question"
                            ref={inputRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    !e.shiftKey &&
                                    !e.nativeEvent.isComposing
                                ) {
                                    e.preventDefault();
                                    ask(draft);
                                }
                            }}
                            rows={1}
                            maxLength={2000}
                            placeholder={
                                outOfQuestions
                                    ? "No questions left today"
                                    : "Ask a question"
                            }
                            disabled={outOfQuestions}
                            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-reading-text field-sizing-content placeholder:text-reading-text-muted focus:outline-none"
                        />
                        {chat.streaming ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={chat.stop}
                                aria-label="Stop answering"
                            >
                                <Square size={14} aria-hidden="true" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!draft.trim() || outOfQuestions}
                                aria-label="Send"
                            >
                                <ArrowUp size={16} aria-hidden="true" />
                            </Button>
                        )}
                    </form>
                    <p className="px-1 text-xs text-reading-text-muted">
                        {chat.quota &&
                            `${chat.quota.remaining} of ${chat.quota.limit} questions left today. `}
                        The Scholar can make mistakes; check its answers against
                        Scripture.
                    </p>
                </div>
            </div>
        </div>
    );
}
