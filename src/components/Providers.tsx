"use client";

import { ReadingModeProvider } from "@/context/reading-mode";

export function Providers({ children }: { children: React.ReactNode }) {
    return <ReadingModeProvider>{children}</ReadingModeProvider>;
}
