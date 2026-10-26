import type { Metadata } from "next";
import Link from "next/link";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { APOSTLES } from "@/lib/ai/apostles";
import { isAiConfigured } from "@/lib/ai/config";

export const metadata: Metadata = {
    title: "Apostles | Dawnscroll",
    description:
        "Talk with AI portrayals of the Twelve and Paul, grounded in Scripture and early church tradition.",
};

export default function ApostlesPage() {
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <header className="border-b border-t-4 border-reading-divider border-t-bronze bg-reading-surface">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 md:px-10 md:py-8">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Explore
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text md:text-5xl">
                        Apostles
                    </h1>
                    <p className="max-w-2xl text-reading-text-muted">
                        Talk with the Twelve and Paul about their lives, their
                        world and what they saw. Each is an AI portrayal
                        grounded in Scripture and early church tradition,
                        speaking from a moment in his own time.
                    </p>
                </div>
            </header>
            {isAiConfigured() ? (
                <PremiumGate feature="apostleMode">
                    <ul className="mx-auto grid w-full max-w-5xl gap-4 px-5 py-8 sm:grid-cols-2 md:px-10 md:py-12 lg:grid-cols-3">
                        {APOSTLES.map((apostle) => (
                            <li key={apostle.id}>
                                <Link
                                    href={`/apostles/${apostle.id}`}
                                    className="flex h-full flex-col gap-3 rounded-lg border border-reading-border bg-reading-surface p-5 transition-colors hover:border-reading-border-strong hover:bg-reading-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                                >
                                    <span className="flex items-center gap-3">
                                        <span
                                            aria-hidden="true"
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze font-serif text-linen"
                                        >
                                            {apostle.initials}
                                        </span>
                                        <span className="flex flex-col">
                                            <span className="font-serif text-xl text-reading-text">
                                                {apostle.name}
                                            </span>
                                            <span className="text-sm text-reading-text-muted">
                                                {apostle.title}
                                            </span>
                                        </span>
                                    </span>
                                    <span className="text-sm text-reading-text">
                                        {apostle.fact}
                                    </span>
                                    <span className="mt-auto text-xs text-reading-text-muted">
                                        Speaking from {apostle.vantage}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </PremiumGate>
            ) : (
                <p className="mx-auto w-full max-w-5xl px-5 py-8 text-reading-text md:px-10">
                    Apostle mode isn&rsquo;t available yet. Check back soon.
                </p>
            )}
        </div>
    );
}
