"use client";

import { useRef, useState } from "react";
import { useToast } from "@/context/toast";
import type { Result } from "@/lib/result";

/**
 * Per-verse user data for one chapter (bookmark ids, highlight colors…)
 * with optimistic updates: the UI changes immediately, then commits, then
 * either settles on the server's value or rolls back with a toast.
 *
 * Decisions read from a ref, not render state, so a tap that lands between
 * a commit finishing and React re-rendering still sees the latest value.
 */
export function useVerseAnnotations<T>(initial: Record<number, T>) {
    const toast = useToast();
    const [values, setValues] = useState(initial);
    const latest = useRef(initial);
    const inFlight = useRef(new Set<number>());

    function apply(verse: number, value: T | undefined) {
        const next = { ...latest.current };
        if (value === undefined) delete next[verse];
        else next[verse] = value;
        latest.current = next;
        setValues(next);
    }

    /**
     * Show `optimistic` for the verse while `commit` runs; `commit` receives
     * the current value and resolves to the value to keep. Ignored while
     * another update to the same verse is in flight.
     */
    async function update(
        verse: number,
        optimistic: (current: T | undefined) => T | undefined,
        commit: (current: T | undefined) => Promise<Result<T | undefined>>,
    ) {
        if (inFlight.current.has(verse)) return;
        inFlight.current.add(verse);
        const previous = latest.current[verse];
        apply(verse, optimistic(previous));
        try {
            const result = await commit(previous);
            if (!result.ok) throw new Error(result.error);
            apply(verse, result.value);
        } catch (error) {
            apply(verse, previous);
            toast.error(
                error instanceof Error && error.message
                    ? error.message
                    : "Something went wrong. Please try again.",
            );
        } finally {
            inFlight.current.delete(verse);
        }
    }

    return {
        get: (verse: number): T | undefined => values[verse],
        update,
    };
}
