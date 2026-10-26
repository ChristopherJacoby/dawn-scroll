"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    BookOpen,
    CalendarCheck,
    Bookmark,
    Highlighter,
    NotebookPen,
    Landmark,
    MessageCircleQuestion,
    Search,
    ScrollText,
    Sprout,
    Users,
    Settings,
    User,
    Menu,
    X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface NavLink {
    href: string;
    icon: React.ElementType;
    label: string;
    /** Shown only once AI chat is configured (see Navigation's props). */
    ai?: boolean;
    /** Other paths that count as this page, e.g. /read/... for Reader. */
    matches?: string[];
}

const navGroups: { label: string; items: NavLink[] }[] = [
    {
        label: "Read",
        items: [
            {
                href: "/reader",
                icon: BookOpen,
                label: "Reader",
                matches: ["/read/"],
            },
            { href: "/search", icon: Search, label: "Search" },
            { href: "/plans", icon: CalendarCheck, label: "Plans" },
        ],
    },
    {
        label: "Your library",
        items: [
            { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
            { href: "/highlights", icon: Highlighter, label: "Highlights" },
            { href: "/notes", icon: NotebookPen, label: "Notes" },
        ],
    },
    {
        label: "Explore",
        items: [
            { href: "/archaeology", icon: Landmark, label: "Archaeology" },
            { href: "/roots", icon: Sprout, label: "Roots" },
            {
                href: "/questions",
                icon: MessageCircleQuestion,
                label: "Hard Questions",
            },
            { href: "/scholar", icon: ScrollText, label: "Scholar", ai: true },
            { href: "/apostles", icon: Users, label: "Apostles", ai: true },
        ],
    },
];

const accountItems: NavLink[] = [
    { href: "/account", icon: User, label: "Account" },
    { href: "/settings", icon: Settings, label: "Settings" },
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                // The current page is filled; hover is the lighter touch.
                active
                    ? "bg-reading-bg-subtle font-semibold text-reading-text"
                    : "text-reading-text-muted hover:bg-reading-surface-raised hover:text-reading-text",
            )}
            aria-current={active ? "page" : undefined}
        >
            <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
            {label}
        </Link>
    );
}

/**
 * The grouped links, then the account links (or Log in when signed out)
 * and credits at the bottom. Shared by the sidebar and the mobile drawer.
 */
function NavLinks({
    aiEnabled,
    signedIn,
    onNavigate,
}: {
    aiEnabled: boolean;
    signedIn: boolean;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const isActive = ({ href, matches = [] }: NavLink) =>
        [href, ...matches].some((path) => pathname.startsWith(path));

    return (
        <>
            <div className="flex flex-col gap-5">
                {navGroups.map((group) => (
                    <div
                        key={group.label}
                        role="group"
                        aria-labelledby={`nav-${group.label}`}
                        className="flex flex-col gap-0.5"
                    >
                        <p
                            id={`nav-${group.label}`}
                            className="px-3 pb-1 text-[0.7rem] font-medium uppercase tracking-wide text-reading-text-muted"
                        >
                            {group.label}
                        </p>
                        {group.items
                            .filter((item) => aiEnabled || !item.ai)
                            .map((item) => (
                                <NavItem
                                    key={item.href}
                                    {...item}
                                    active={isActive(item)}
                                    onClick={onNavigate}
                                />
                            ))}
                    </div>
                ))}
            </div>
            <div className="mt-auto flex flex-col gap-0.5 border-t border-reading-divider pt-4">
                {signedIn ? (
                    accountItems.map((item) => (
                        <NavItem
                            key={item.href}
                            {...item}
                            active={isActive(item)}
                            onClick={onNavigate}
                        />
                    ))
                ) : (
                    <div className="flex flex-col gap-2 px-1 pb-1">
                        <Link
                            href="/login"
                            onClick={onNavigate}
                            className={buttonVariants({ size: "sm" })}
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            onClick={onNavigate}
                            className={buttonVariants({
                                variant: "secondary",
                                size: "sm",
                            })}
                        >
                            Create an account
                        </Link>
                    </div>
                )}
                <Link
                    href="/credits"
                    onClick={onNavigate}
                    className="px-3 py-2 text-xs text-reading-text-muted hover:text-reading-text"
                >
                    Credits &amp; sources
                </Link>
            </div>
        </>
    );
}

export function Navigation({
    aiEnabled,
    signedIn,
}: {
    aiEnabled: boolean;
    signedIn: boolean;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Desktop sidebar (md+) ─────────────────────────────── */}
            <nav className="hidden md:flex print:hidden h-screen w-56 shrink-0 sticky top-0 flex-col gap-1 overflow-y-auto border-r border-reading-divider bg-reading-surface px-3 py-6">
                <Link
                    href="/"
                    className="mb-4 self-start rounded-md px-3 font-serif text-lg text-reading-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                >
                    Dawnscroll
                </Link>
                <NavLinks aiEnabled={aiEnabled} signedIn={signedIn} />
            </nav>

            {/* ── Mobile top bar ────────────────────────────────────── */}
            <div className="md:hidden print:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b border-reading-divider bg-reading-surface px-4">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="rounded-lg p-1.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text"
                    aria-label="Open navigation"
                >
                    <Menu size={20} />
                </button>
                <Link
                    href="/"
                    className="rounded-md font-serif text-lg text-reading-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                >
                    Dawnscroll
                </Link>
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
                    "md:hidden fixed left-0 top-0 bottom-0 z-50 w-56 flex flex-col gap-1 overflow-y-auto",
                    "border-r border-reading-divider bg-reading-surface px-3 py-6",
                    "transition-transform duration-300",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
                // Off-screen links stay out of the tab order.
                inert={!mobileOpen}
            >
                <div className="mb-4 flex items-center justify-between px-3">
                    <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md font-serif text-lg text-reading-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        Dawnscroll
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg p-1.5 text-reading-text-muted transition-colors hover:bg-reading-bg-subtle hover:text-reading-text"
                        aria-label="Close navigation"
                    >
                        <X size={18} />
                    </button>
                </div>
                <NavLinks
                    aiEnabled={aiEnabled}
                    signedIn={signedIn}
                    onNavigate={() => setMobileOpen(false)}
                />
            </nav>
        </>
    );
}
