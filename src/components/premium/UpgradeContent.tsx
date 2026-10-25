import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { FEATURES, PREMIUM_FEATURES } from "@/lib/premium/features";
import { formatPrice, PLANS, TRIAL_DAYS } from "@/lib/premium/plans";

/** What Premium includes, with trial and plan links. */
export function UpgradeContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="flex flex-col gap-5 font-sans">
            <ul className="flex flex-col gap-2 text-sm text-reading-text">
                {PREMIUM_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                        <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-reading-accent"
                            aria-hidden="true"
                        />
                        {FEATURES[feature].label}
                    </li>
                ))}
            </ul>
            <p className="text-sm text-reading-text-muted">
                {TRIAL_DAYS} days free, then {formatPrice(PLANS.monthly.price)}{" "}
                a month or {formatPrice(PLANS.annual.price)} a year. Cancel
                anytime.
            </p>
            <div className="flex flex-wrap gap-3">
                <Link
                    href="/pricing"
                    onClick={onNavigate}
                    className={buttonVariants({ variant: "primary" })}
                >
                    Start free trial
                </Link>
                <Link
                    href="/pricing#plans"
                    onClick={onNavigate}
                    className={buttonVariants({ variant: "secondary" })}
                >
                    View plans
                </Link>
            </div>
        </div>
    );
}
