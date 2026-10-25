"use client";

import { ArrowUp, BookOpen, Plus, Square, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PassageRef } from "@/lib/ai/chat";
import { bookName } from "@/lib/bible/references";
import { cn } from "@/lib/cn";
import { AIMessage, UserMessage } from "./ChatMessages";
import { type Quota, useChat } from "./useChat";

function passageLabel(passage: PassageRef): string {
    const name = bookName(passage.book) ?? passage.book;
    return `${name} ${passage.chapter}${passage.verse ? `:${passage.verse}` : ""}`;
}

/**
 * Keeps the newest text in view unless the reader has scrolled up. Scrolls
 * to the bottom of the page itself, below the sticky composer, so the
 * newest line is never hidden behind it.
 */
function useStickToBottom(dependency: unknown) {
    const stick = useRef(true);
    useEffect(() => {
        const onScroll = () => {
            stick.current =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 80;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        if (stick.current) {
            window.scrollTo({ top: document.documentElement.scrollHeight });
        }
    }, [dependency]);
    /** Call when the reader acts, e.g. sends a question. */
    return () => {
        stick.current = true;
    };
}

export interface ChatViewProps {
    endpoint: string;
    /** Session storage key; scoped to `userId` so accounts never share. */
    storageKey: string;
    userId: string;
    /** Extra request fields, such as the apostle being asked. */
    extraBody?: Record<string, unknown>;
    /** The page's own path, to drop a detached passage from the URL. */
    path: string;
    passage?: PassageRef | null;
    initialQuota: Quota | null;
    title: string;
    subtitle: string;
    /** Initials for an avatar beside the title (Apostle mode). */
    avatar?: string;
    backLink?: { href: string; label: string };
    /** Labels the replies, e.g. "Scholar". */
    speaker: string;
    inputLabel: string;
    /** Shown before the first question; gets the attached passage, if any. */
    intro: (passage: string | null) => string;
    suggestions: (passage: string | null) => string[];
    disclaimer: string;
    variant?: "scholar" | "apostle";
}

/** A streamed AI conversation page: header, messages and composer. */
export function ChatView({
    endpoint,
    storageKey,
    userId,
    extraBody,
    path,
    passage: initialPassage = null,
    initialQuota,
    title,
    subtitle,
    avatar,
    backLink,
    speaker,
    inputLabel,
    intro,
    suggestions,
    disclaimer,
    variant = "scholar",
}: ChatViewProps) {
    const router = useRouter();
    const chat = useChat({
        endpoint,
        storageKey: `${storageKey}.${userId}`,
        extraBody,
        passage: initialPassage,
        initialQuota,
    });
    const [draft, setDraft] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const follow = useStickToBottom(chat.messages);
    const outOfQuestions = chat.quota?.remaining === 0;
    const label = chat.passage ? passageLabel(chat.passage) : null;

    // A passage in the URL is a one-time request from the reader: once
    // read, drop it, so Back or a reload returns to this conversation
    // instead of starting a new one about that passage.
    useEffect(() => {
        if (initialPassage) router.replace(path, { scroll: false });
    }, [initialPassage, path, router]);

    function ask(text: string) {
        follow();
        if (chat.send(text)) setDraft("");
        inputRef.current?.focus();
    }

    const last = chat.messages.at(-1);
    const status = chat.streaming
        ? `${speaker} is answering…`
        : last?.status === "done"
          ? `${speaker} has answered.`
          : "";

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <header
                className={cn(
                    "border-b border-reading-divider bg-reading-surface",
                    variant === "apostle" && "border-t-4 border-t-bronze",
                )}
            >
                <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-4 px-5 py-6 md:px-10">
                    <div className="flex items-center gap-4">
                        {avatar && (
                            <span
                                aria-hidden="true"
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bronze font-serif text-lg text-linen"
                            >
                                {avatar}
                            </span>
                        )}
                        <div className="flex flex-col gap-1">
                            {backLink && (
                                <Link
                                    href={backLink.href}
                                    className="self-start text-sm text-reading-link"
                                >
                                    {backLink.label}
                                </Link>
                            )}
                            <h1 className="font-serif text-3xl leading-tight text-reading-text md:text-4xl">
                                {title}
                            </h1>
                            <p className="text-sm text-reading-text-muted">
                                {subtitle}
                            </p>
                        </div>
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
                {/* One short announcement per answer, rather than a live
                    region that would re-read every streamed word. */}
                <p role="status" className="sr-only">
                    {status}
                </p>
                <div className="flex flex-1 flex-col gap-8 py-8">
                    {chat.messages.length === 0 ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-reading-text">{intro(label)}</p>
                            <ul className="flex flex-col gap-2">
                                {suggestions(label).map((s) => (
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
                                    speaker={speaker}
                                    onRetry={
                                        message === last
                                            ? () => {
                                                  chat.retry();
                                                  inputRef.current?.focus();
                                              }
                                            : undefined
                                    }
                                />
                            ),
                        )
                    )}
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
                                onClick={chat.clearPassage}
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
                        <label htmlFor="chat-question" className="sr-only">
                            {inputLabel}
                        </label>
                        <textarea
                            id="chat-question"
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
                        {disclaimer}
                    </p>
                </div>
            </div>
        </div>
    );
}
