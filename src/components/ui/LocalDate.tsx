"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

interface LocalDateProps {
    iso: string;
    options?: Intl.DateTimeFormatOptions;
}

/**
 * A date in the reader's own time zone. The server doesn't know it, so it
 * renders UTC and the client re-renders in local time right after
 * hydration (no mismatch: hydration uses the server snapshot).
 */
export function LocalDate({
    iso,
    options = { month: "short", day: "numeric", year: "numeric" },
}: LocalDateProps) {
    const isClient = useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
    const date = new Date(iso);
    return (
        <time dateTime={iso}>
            {isClient
                ? date.toLocaleDateString(undefined, options)
                : date.toLocaleDateString("en-US", {
                      ...options,
                      timeZone: "UTC",
                  })}
        </time>
    );
}
