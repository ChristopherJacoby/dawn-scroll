"use client";

import { useRef, useState } from "react";
import { useToast } from "@/context/toast";
import type { Result } from "@/lib/result";

/**
 * Persists a target value for a verse. Receives the last value the server
 * confirmed (never an optimistic placeholder) and the target to reach;
 * resolves to the value the server now holds.
 */
export type CommitAnnotation<T> = (
    settled: T | undefined,
    target: T | undefined,
) => Promise<Result<T | undefined>>;

/**
 * Per-verse user data for one chapter (bookmark ids, highlight colors,
 * notes) with optimistic updates. The UI shows each target immediately;
 * commits run one at a time per verse, and the latest target always wins:
 * changes made while a commit is in flight are queued (replacing any
 * earlier queued change) and committed against the server's settled value.
 * If the last commit fails, the verse reverts to that value with a toast.
 */
export function useVerseAnnotations<T>(initial: Record<number, T>) {
    const toast = useToast();
    const [values, setValues] = useState(initial);
    const [pending, setPending] = useState<ReadonlySet<number>>(new Set());
    const shown = useRef(initial);
    const settled = useRef(initial);
    const queued = useRef(
        new Map<
            number,
            { target: T | undefined; commit: CommitAnnotation<T> }
        >(),
    );
    const draining = useRef(new Set<number>());

    function write(
        map: Record<number, T>,
        verse: number,
        value: T | undefined,
    ) {
        const next = { ...map };
        if (value === undefined) delete next[verse];
        else next[verse] = value;
        return next;
    }

    function show(verse: number, value: T | undefined) {
        shown.current = write(shown.current, verse, value);
        setValues(shown.current);
    }

    function setVersePending(verse: number, isPending: boolean) {
        setPending((current) => {
            const next = new Set(current);
            if (isPending) next.add(verse);
            else next.delete(verse);
            return next;
        });
    }

    async function drain(verse: number) {
        draining.current.add(verse);
        setVersePending(verse, true);
        let next;
        while ((next = queued.current.get(verse))) {
            queued.current.delete(verse);
            let error: string | null = null;
            try {
                const result = await next.commit(
                    settled.current[verse],
                    next.target,
                );
                if (result.ok) {
                    settled.current = write(
                        settled.current,
                        verse,
                        result.value,
                    );
                } else {
                    error = result.error;
                }
            } catch {
                error = "Something went wrong. Please try again.";
            }
            // Only the last change decides what's shown; earlier ones are
            // superseded either way.
            if (!queued.current.has(verse)) {
                show(verse, settled.current[verse]);
                if (error) toast.error(error);
            }
        }
        draining.current.delete(verse);
        setVersePending(verse, false);
    }

    /** Show `target` for the verse now and commit it (latest wins). */
    function update(
        verse: number,
        target: T | undefined,
        commit: CommitAnnotation<T>,
    ) {
        show(verse, target);
        queued.current.set(verse, { target, commit });
        if (!draining.current.has(verse)) void drain(verse);
    }

    return {
        /** For rendering. */
        get: (verse: number): T | undefined => values[verse],
        /** For event handlers: includes changes not yet rendered. */
        latest: (verse: number): T | undefined => shown.current[verse],
        isPending: (verse: number) => pending.has(verse),
        update,
    };
}
