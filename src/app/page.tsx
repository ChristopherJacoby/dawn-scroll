"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";

type ReadingMode = "light" | "dark" | "sepia";

export default function Home() {
    const [mode, setMode] = useState<ReadingMode>("light");

    useEffect(() => {
        document.body.dataset.readingMode = mode;
    }, [mode]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 px-8 py-16">
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
            <div className="flex flex-col gap-4">
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

            {/* Card variants */}
            <div className="grid w-full max-w-2xl gap-6">
                {/* All slots */}
                <Card>
                    <CardHeader>
                        <p className="font-sans font-medium text-reading-text">
                            Card with all slots
                        </p>
                    </CardHeader>
                    <CardBody>
                        <p className="text-sm text-reading-text-muted">
                            Body content goes here.
                        </p>
                    </CardBody>
                    <CardFooter>
                        <Button size="sm">Action</Button>
                    </CardFooter>
                </Card>

                {/* Body only */}
                <Card padding="md">
                    <p className="text-sm text-reading-text-muted">
                        Card with padding, no slots.
                    </p>
                </Card>

                {/* No border, medium shadow */}
                <Card border={false} shadow="md" padding="md">
                    <p className="text-sm text-reading-text-muted">
                        No border, shadow only.
                    </p>
                </Card>
            </div>
        </div>
    );
}
