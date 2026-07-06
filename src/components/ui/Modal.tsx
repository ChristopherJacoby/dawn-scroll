"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
    className,
}: ModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className={cn(
                        "fixed inset-0 z-40",
                        "bg-stone-night/60 backdrop-blur-sm",
                        "transition-opacity duration-200",
                        "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
                    )}
                />
                <Dialog.Content
                    className={cn(
                        "fixed left-1/2 top-1/2 z-50",
                        "-translate-x-1/2 -translate-y-1/2",
                        "w-full max-w-lg",
                        "rounded-lg bg-reading-surface-raised border border-reading-border-strong shadow-lg",
                        "transition-all duration-200",
                        "data-[state=open]:opacity-100 data-[state=open]:scale-100",
                        "data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
                        "focus:outline-none",
                        className,
                    )}
                >
                    <ModalHeader onClose={() => onOpenChange(false)}>
                        {title}
                        {description && (
                            <Dialog.Description className="mt-1 text-sm font-normal text-reading-text-muted">
                                {description}
                            </Dialog.Description>
                        )}
                    </ModalHeader>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function ModalHeader({
    children,
    onClose,
    className,
}: React.HTMLAttributes<HTMLDivElement> & { onClose: () => void }) {
    return (
        <div
            className={cn(
                "flex items-start justify-between border-b border-reading-divider px-6 py-4",
                className,
            )}
        >
            <Dialog.Title className="font-sans text-base font-medium text-reading-text">
                {children}
            </Dialog.Title>
            <Dialog.Close
                onClick={onClose}
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
    );
}

export function ModalBody({
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

export function ModalFooter({
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
