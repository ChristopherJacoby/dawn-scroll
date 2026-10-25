"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast";

/** Opens the Stripe Customer Portal, where the plan can be changed or canceled. */
export function ManageSubscriptionButton() {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    async function open() {
        setLoading(true);
        try {
            const response = await fetch("/api/subscriptions/portal", {
                method: "POST",
            });
            const body = (await response.json().catch(() => null)) as {
                url?: string;
                error?: string;
            } | null;
            if (!response.ok || !body?.url) {
                throw new Error(
                    body?.error ?? "Couldn't open subscription management.",
                );
            }
            window.location.assign(body.url);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Couldn't open subscription management.",
            );
            setLoading(false);
        }
    }

    return (
        <Button variant="secondary" loading={loading} onClick={open}>
            Manage or cancel subscription
        </Button>
    );
}
