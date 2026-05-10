"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type ReadingMode = "light" | "dark" | "sepia";

export default function Home() {
    const [mode, setMode] = useState<ReadingMode>("light");

    useEffect(() => {
        document.body.dataset.readingMode = mode;
    }, [mode]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 px-8">
            <div className="text-center">
                <h1 className="font-serif text-4xl text-reading-text">
                    Dawnscroll
                </h1>
                <p className="mt-2 font-sans text-reading-text-muted">
                    Read, explore, and understand the Bible
                </p>
            </div>

            {/* Reading mode toggle */}
            <div className="flex gap-3">
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

            {/* Button variants */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                </div>
            </div>
        </div>
    );
}
