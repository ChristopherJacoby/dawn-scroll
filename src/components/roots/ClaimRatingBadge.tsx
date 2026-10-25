import { CircleHelp, CircleX, Scale, Shield, ShieldCheck } from "lucide-react";
import { CLAIM_RATINGS } from "@/lib/roots/ratings";
import type { ClaimRating } from "@/lib/roots/types";
import { cn } from "@/lib/cn";

const ICONS: Record<ClaimRating, React.ElementType> = {
    established: ShieldCheck,
    supported: Shield,
    debated: Scale,
    unverified: CircleHelp,
    contradicted: CircleX,
};

/** The rating as an icon plus its label; the label alone carries meaning. */
export function ClaimRatingBadge({
    rating,
    scale = CLAIM_RATINGS,
    className,
}: {
    rating: ClaimRating;
    /** Labels and descriptions; Roots' wording unless given. */
    scale?: Record<ClaimRating, { label: string; description: string }>;
    className?: string;
}) {
    const Icon = ICONS[rating];
    const strong = rating === "established" || rating === "supported";
    return (
        <span
            title={scale[rating].description}
            className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-sans text-xs font-semibold",
                strong
                    ? "bg-reading-accent text-reading-accent-contrast"
                    : "border border-reading-border-strong text-reading-text-muted",
                className,
            )}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {scale[rating].label}
        </span>
    );
}
