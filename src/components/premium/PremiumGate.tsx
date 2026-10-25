import { Sparkles } from "lucide-react";
import { FEATURES, type FeatureKey } from "@/lib/premium/features";
import { canUse } from "@/lib/premium/subscription";
import { UpgradeContent } from "./UpgradeContent";

/**
 * Page-level gate: shows its children to visitors who may use the feature
 * (everyone, while Premium is off), and an upgrade prompt to everyone else.
 */
export async function PremiumGate({
    feature,
    children,
}: {
    feature: FeatureKey;
    children: React.ReactNode;
}) {
    if (await canUse(feature)) return children;
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg px-5 py-12 md:px-10 md:py-16">
            <section
                aria-labelledby="premium-gate-heading"
                className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-6"
            >
                <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Dawnscroll Premium
                </p>
                <h2
                    id="premium-gate-heading"
                    className="font-serif text-2xl leading-snug text-reading-text"
                >
                    This is part of Premium
                </h2>
                <p className="text-reading-text">{FEATURES[feature].label}.</p>
                <UpgradeContent />
            </section>
        </div>
    );
}
