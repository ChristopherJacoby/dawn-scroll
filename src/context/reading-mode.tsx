"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ReadingMode = "light" | "dark" | "sepia";

interface ReadingModeContextValue {
    mode: ReadingMode;
    setMode: (mode: ReadingMode) => void;
}

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);

export function ReadingModeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mode, setMode] = useState<ReadingMode>("light");

    useEffect(() => {
        document.body.dataset.readingMode = mode;
    }, [mode]);

    return (
        <ReadingModeContext.Provider value={{ mode, setMode }}>
            {children}
        </ReadingModeContext.Provider>
    );
}

export function useReadingMode() {
    const ctx = useContext(ReadingModeContext);
    if (!ctx) {
        throw new Error(
            "useReadingMode must be used within ReadingModeProvider",
        );
    }
    return ctx;
}
