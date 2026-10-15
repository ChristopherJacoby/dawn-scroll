import { CircleHelp, Scale, Shield, ShieldCheck } from "lucide-react";
import { CREDIBILITY } from "@/lib/archaeology/credibility";
import type { CredibilityRating } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

const ICONS: Record<CredibilityRating, React.ElementType> = {
    established: ShieldCheck,
    supported: Shield,
    debated: Scale,
    unverified: CircleHelp,
};

/** The rating as an icon plus its label; the label alone carries meaning. */
export function CredibilityBadge({
    rating,
    className,
}: {
    rating: CredibilityRating;
    className?: string;
}) {
    const Icon = ICONS[rating];
    const strong = rating === "established" || rating === "supported";
    return (
        <span
            title={CREDIBILITY[rating].description}
            className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-sans text-xs font-semibold",
                strong
                    ? "bg-reading-accent text-reading-accent-contrast"
                    : "border border-reading-border-strong text-reading-text-muted",
                className,
            )}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {CREDIBILITY[rating].label}
        </span>
    );
}
