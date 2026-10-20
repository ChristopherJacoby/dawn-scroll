import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CredibilityBadge } from "@/components/archaeology/CredibilityBadge";
import { formatScriptureRef } from "@/lib/archaeology/refs";
import type { FindingSummary } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

interface FindingCardProps {
    finding: FindingSummary;
    /** Heading level, so the card fits the page outline it sits in. */
    as?: "h2" | "h3";
    /**
     * Show the photo, site and scripture references (hub cards). The photo's
     * credit is on the finding page the card links to.
     */
    showContext?: boolean;
    className?: string;
}

/** Title, credibility, two-sentence summary, and a link to the full finding. */
export function FindingCard({
    finding,
    as: Heading = "h3",
    showContext = false,
    className,
}: FindingCardProps) {
    return (
        <article
            aria-labelledby={`finding-${finding.slug}`}
            className={cn(
                "flex flex-col gap-3 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-4 font-sans",
                className,
            )}
        >
            {showContext && finding.image && (
                <div className="relative -mx-4 -mt-4 aspect-[3/2] overflow-hidden rounded-t-lg border-b border-reading-divider bg-reading-bg-subtle">
                    <Image
                        src={finding.image.url}
                        // Decorative here: the title names what's pictured.
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="flex items-start justify-between gap-3">
                <Heading
                    id={`finding-${finding.slug}`}
                    className="font-serif text-xl leading-snug text-reading-text"
                >
                    {finding.title}
                </Heading>
                <CredibilityBadge rating={finding.credibility} />
            </div>
            {showContext && (
                <div className="flex flex-col gap-1 text-xs text-reading-text-muted">
                    <p className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {finding.siteName}
                    </p>
                    <p>{finding.refs.map(formatScriptureRef).join("; ")}</p>
                </div>
            )}
            <p className="text-sm leading-relaxed text-reading-text">
                {finding.summary}
            </p>
            <Link
                href={`/archaeology/${finding.slug}`}
                className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-reading-link"
            >
                View full finding
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">: {finding.title}</span>
            </Link>
        </article>
    );
}
