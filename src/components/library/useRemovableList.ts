"use client";

import { useState } from "react";
import { useToast } from "@/context/toast";
import type { Result } from "@/lib/result";

/**
 * Optimistic removal for a server-rendered list: items are hidden by id
 * and the list is always derived from the server's order, so a failed
 * removal reappears exactly where it was.
 */
export function useRemovableList<T extends { id: string }>(
    items: T[],
    remove: (id: string) => Promise<Result<null>>,
    describe: (item: T) => string,
) {
    const toast = useToast();
    const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

    function setItemHidden(id: string, isHidden: boolean) {
        setHidden((current) => {
            const next = new Set(current);
            if (isHidden) next.add(id);
            else next.delete(id);
            return next;
        });
    }

    async function removeItem(item: T) {
        setItemHidden(item.id, true);
        const result = await remove(item.id).catch(() => null);
        // 404: already gone, which is what the reader wanted.
        if (result && (result.ok || result.status === 404)) return;
        setItemHidden(item.id, false);
        toast.error(`Couldn't remove ${describe(item)}.`);
    }

    return {
        visible: items.filter((item) => !hidden.has(item.id)),
        removeItem,
    };
}
