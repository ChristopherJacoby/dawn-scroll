"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The reader's time zone; the server doesn't know it, so it renders in UTC
 * and the client corrects it right after hydration.
 */
export function useTimeZone() {
    return useSyncExternalStore(
        subscribe,
        () => Intl.DateTimeFormat().resolvedOptions().timeZone,
        () => "UTC",
    );
}
