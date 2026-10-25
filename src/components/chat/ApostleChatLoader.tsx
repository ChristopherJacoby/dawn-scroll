"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

/** The chat reads its saved conversation from sessionStorage, so it renders client-only. */
export const ApostleChatLoader = dynamic(
    () => import("./ApostleChat").then((m) => m.ApostleChat),
    {
        ssr: false,
        loading: () => (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-10 md:px-10">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-24 w-full" />
            </div>
        ),
    },
);
