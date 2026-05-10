"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Compass, MessageSquare, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
    { href: "/reader", icon: BookOpen, label: "Reader" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/profile", icon: User, label: "Profile" },
];

function NavItem({
    href,
    icon: Icon,
    label,
    active,
    onClick,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                    ? "bg-reading-bg-subtle text-reading-text"
                    : "text-reading-text-muted hover:bg-reading-bg-subtle hover:text-reading-text",
            )}
            aria-current={active ? "page" : undefined}
        >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
            {label}
        </Link>
    );
}

export function Navigation() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <>
            {/* ── Desktop sidebar (md+) ─────────────────────────────── */}
            <nav className="hidden md:flex h-screen w-56 shrink-0 sticky top-0 flex-col gap-1 border-r border-reading-border bg-reading-bg px-3 py-6">
                <p className="mb-4 px-3 font-serif text-lg text-reading-text">
                    Dawnscroll
                </p>
                {navItems.map((item) => (
                    <NavItem
                        key={item.href}
                        {...item}
                        active={isActive(item.href)}
                    />
                ))}
            </nav>

            {/* ── Mobile top bar ────────────────────────────────────── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b border-reading-border bg-reading-bg px-4">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="rounded-lg p-1.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text"
                    aria-label="Open navigation"
                >
                    <Menu size={20} />
                </button>
                <span className="font-serif text-lg text-reading-text">
                    Dawnscroll
                </span>
            </div>

            {/* ── Mobile overlay backdrop ───────────────────────────── */}
            <div
                className={cn(
                    "md:hidden fixed inset-0 z-40 bg-stone-night/60 transition-opacity duration-300",
                    mobileOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none",
                )}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* ── Mobile slide-in nav ───────────────────────────────── */}
            <nav
                className={cn(
                    "md:hidden fixed left-0 top-0 bottom-0 z-50 w-56 flex flex-col gap-1",
                    "border-r border-reading-border bg-reading-bg px-3 py-6",
                    "transition-transform duration-300",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="mb-4 flex items-center justify-between px-3">
                    <span className="font-serif text-lg text-reading-text">
                        Dawnscroll
                    </span>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg p-1.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text"
                        aria-label="Close navigation"
                    >
                        <X size={18} />
                    </button>
                </div>
                {navItems.map((item) => (
                    <NavItem
                        key={item.href}
                        {...item}
                        active={isActive(item.href)}
                        onClick={() => setMobileOpen(false)}
                    />
                ))}
            </nav>
        </>
    );
}
