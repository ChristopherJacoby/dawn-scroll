import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatMarkdown } from "./ChatMarkdown";
import type { ChatMessage } from "./useChat";

export function UserMessage({ message }: { message: ChatMessage }) {
    return (
        <div className="flex justify-end">
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-reading-surface-raised px-4 py-2.5 text-reading-text ring-1 ring-inset ring-reading-border">
                {message.content}
            </p>
        </div>
    );
}

export function AIMessage({
    message,
    speaker,
    onRetry,
}: {
    message: ChatMessage;
    /** Who's answering, e.g. "Scholar". */
    speaker: string;
    onRetry?: () => void;
}) {
    const streaming = message.status === "streaming";
    return (
        <div className="flex flex-col gap-2" aria-busy={streaming}>
            <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                {speaker}
            </p>
            {message.content ? (
                <div className="text-reading-text leading-relaxed">
                    <ChatMarkdown source={message.content} />
                    {streaming && (
                        <span
                            aria-hidden="true"
                            className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-reading-text-muted align-middle"
                        />
                    )}
                </div>
            ) : (
                streaming && (
                    <p
                        className="flex items-center gap-1 text-reading-text-muted"
                        aria-hidden="true"
                    >
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                aria-hidden="true"
                                className="h-1.5 w-1.5 animate-pulse rounded-full bg-reading-text-muted"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </p>
                )
            )}
            {message.status === "stopped" && (
                <p className="flex flex-wrap items-center gap-3 text-sm text-reading-text-muted">
                    Stopped.
                    {onRetry && (
                        <Button variant="ghost" size="sm" onClick={onRetry}>
                            <RotateCcw size={14} aria-hidden="true" />
                            Ask again
                        </Button>
                    )}
                </p>
            )}
            {message.truncated && (
                <p className="text-sm text-reading-text-muted">
                    This answer reached its length limit. Ask a follow-up to
                    continue.
                </p>
            )}
            {message.status === "error" && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center gap-3 rounded-md border border-reading-danger px-3 py-2 text-sm text-reading-danger"
                >
                    <span>{message.error}</span>
                    {message.retryable && onRetry && (
                        <Button variant="ghost" size="sm" onClick={onRetry}>
                            <RotateCcw size={14} aria-hidden="true" />
                            Try again
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
