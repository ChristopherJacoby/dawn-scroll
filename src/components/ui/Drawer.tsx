"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";

interface DrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function Drawer({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
}: DrawerProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className={cn(
                        "fixed inset-0 z-40",
                        "bg-stone-night/60 backdrop-blur-sm",
                        "transition-opacity duration-300",
                        "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
                    )}
                />
                <Dialog.Content
                    className={cn(
                        "fixed bottom-0 left-0 right-0 z-50",
                        "max-h-[85dvh] flex flex-col",
                        "rounded-t-lg bg-reading-surface-raised border-t border-x border-reading-border-strong shadow-lg",
                        "transition-transform duration-300 ease-out",
                        "data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full",
                        "focus:outline-none",
                        className,
                    )}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-reading-divider" />
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-reading-divider px-6 py-4">
                        <div>
                            <Dialog.Title className="font-sans text-base font-medium text-reading-text">
                                {title}
                            </Dialog.Title>
                            {description && (
                                <Dialog.Description className="mt-1 text-sm text-reading-text-muted">
                                    {description}
                                </Dialog.Description>
                            )}
                        </div>
                        <Dialog.Close
                            className="ml-4 rounded p-1 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text focus:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                            aria-label="Close"
                        >
                            <svg
                                width="16"
                                height="16"
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
                        </Dialog.Close>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export function DrawerBody({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("px-6 py-4", className)} {...props}>
            {children}
        </div>
    );
}

export function DrawerFooter({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "flex justify-end gap-3 border-t border-reading-divider px-6 py-4",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
