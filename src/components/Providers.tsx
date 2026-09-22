"use client";

import {
    ReadingModeProvider,
    type ReadingPreferences,
} from "@/context/reading-mode";
import { ToastProvider } from "@/context/toast";

export function Providers({
    children,
    account,
}: {
    children: React.ReactNode;
    account?: ReadingPreferences | null;
}) {
    return (
        <ReadingModeProvider account={account}>
            <ToastProvider>{children}</ToastProvider>
        </ReadingModeProvider>
    );
}
