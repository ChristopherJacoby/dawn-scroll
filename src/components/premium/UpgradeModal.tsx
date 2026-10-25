"use client";

import { Modal } from "@/components/ui/Modal";
import { FEATURES, type FeatureKey } from "@/lib/premium/features";
import { UpgradeContent } from "./UpgradeContent";

/** The paywall: shown when a free visitor reaches for a premium feature. */
export function UpgradeModal({
    feature,
    open,
    onOpenChange,
}: {
    feature: FeatureKey;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Dawnscroll Premium"
            description={`${FEATURES[feature].label} is part of Premium.`}
        >
            <UpgradeContent onNavigate={() => onOpenChange(false)} />
        </Modal>
    );
}
