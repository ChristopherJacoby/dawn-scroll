"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast";
import type { PlanKey } from "@/lib/premium/plans";

/** Starts Stripe Checkout for a plan and sends the browser there. */
export function CheckoutButton({
    plan,
    label,
    variant = "primary",
}: {
    plan: PlanKey;
    label: string;
    variant?: "primary" | "secondary";
}) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    async function start() {
        setLoading(true);
        try {
            const response = await fetch("/api/subscriptions/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            const body = (await response.json().catch(() => null)) as {
                url?: string;
                error?: string;
            } | null;
            if (!response.ok || !body?.url) {
                throw new Error(body?.error ?? "Couldn't start checkout.");
            }
            window.location.assign(body.url);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Couldn't start checkout.",
            );
            setLoading(false);
        }
    }

    return (
        <Button
            variant={variant}
            size="lg"
            loading={loading}
            onClick={start}
            className="w-full"
        >
            {label}
        </Button>
    );
}
