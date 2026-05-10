"use client";

import { useEffect, useState } from "react";

type ReadingMode = "light" | "dark" | "sepia";

export default function Home() {
    const [mode, setMode] = useState<ReadingMode>("light");

    useEffect(() => {
        document.body.dataset.readingMode = mode;
    }, [mode]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center">
            <h1 className="font-serif text-4xl text-reading-text">
                Dawnscroll
            </h1>
            <p className="mt-2 font-sans text-reading-text-muted">
                Read, explore, and understand the Bible
            </p>
            <div className="mt-8 flex gap-3">
                {(["light", "dark", "sepia"] as ReadingMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className="rounded-full border border-reading-border px-4 py-1 text-sm capitalize text-reading-text transition-colors hover:bg-reading-bg-subtle"
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>
    );
}
