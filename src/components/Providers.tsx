"use client";

import { ReadingModeProvider } from "@/context/reading-mode";
import { ToastProvider } from "@/context/toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ReadingModeProvider>
            <ToastProvider>{children}</ToastProvider>
        </ReadingModeProvider>
    );
}
