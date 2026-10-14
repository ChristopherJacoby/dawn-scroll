import Link from "next/link";
import { cn } from "@/lib/cn";

interface SortLinksProps<T extends string> {
    label: string;
    basePath: string;
    current: T;
    options: readonly { value: T; label: string }[];
}

/** Segmented sort control; each option is a link to `?sort=value`. */
export function SortLinks<T extends string>({
    label,
    basePath,
    current,
    options,
}: SortLinksProps<T>) {
    return (
        <nav
            aria-label={label}
            className="flex rounded-md border border-reading-border-strong p-0.5 text-sm"
        >
            {options.map(({ value, label: optionLabel }) => (
                <Link
                    key={value}
                    href={`${basePath}?sort=${value}`}
                    aria-current={current === value ? "true" : undefined}
                    className={cn(
                        "rounded px-3 py-1.5 font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                        current === value
                            ? "bg-reading-accent text-reading-accent-contrast"
                            : "text-reading-text hover:bg-reading-bg-subtle",
                    )}
                >
                    {optionLabel}
                </Link>
            ))}
        </nav>
    );
}
