"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "info";

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    open: boolean;
}

interface ToastContextValue {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeAccent: Record<ToastType, string> = {
    success: "border-l-sage",
    error: "border-l-rust",
    info: "border-l-bronze",
};

const typeLabel: Record<ToastType, string> = {
    success: "Success",
    error: "Error",
    info: "Info",
};

const typeLabelColor: Record<ToastType, string> = {
    success: "text-sage",
    error: "text-rust",
    info: "text-bronze",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, type, message, open: true }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
        );
        setTimeout(
            () => setToasts((prev) => prev.filter((t) => t.id !== id)),
            300,
        );
    }, []);

    return (
        <ToastContext.Provider
            value={{
                success: (msg) => addToast("success", msg),
                error: (msg) => addToast("error", msg),
                info: (msg) => addToast("info", msg),
            }}
        >
            <RadixToast.Provider duration={4000} swipeDirection="right">
                {children}
                {toasts.map((t) => (
                    <RadixToast.Root
                        key={t.id}
                        open={t.open}
                        onOpenChange={(open) => {
                            if (!open) dismiss(t.id);
                        }}
                        className={cn(
                            "flex items-start justify-between gap-3",
                            "rounded-xl border border-reading-border border-l-4 bg-reading-bg shadow-md",
                            "px-4 py-3 w-80",
                            "transition-all duration-200",
                            "data-[state=open]:opacity-100 data-[state=open]:translate-x-0",
                            "data-[state=closed]:opacity-0 data-[state=closed]:translate-x-full",
                            typeAccent[t.type],
                        )}
                    >
                        <div>
                            <RadixToast.Title
                                className={cn(
                                    "text-xs font-semibold uppercase tracking-wide",
                                    typeLabelColor[t.type],
                                )}
                            >
                                {typeLabel[t.type]}
                            </RadixToast.Title>
                            <RadixToast.Description className="mt-0.5 text-sm text-reading-text">
                                {t.message}
                            </RadixToast.Description>
                        </div>
                        <RadixToast.Close
                            className="mt-0.5 shrink-0 text-reading-text-muted transition-colors hover:text-reading-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-clay"
                            aria-label="Close"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M12 4L4 12M4 4l8 8"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </RadixToast.Close>
                    </RadixToast.Root>
                ))}
                <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
            </RadixToast.Provider>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
