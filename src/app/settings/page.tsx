import type { Metadata } from "next";
import { SettingsForm } from "@/components/account/SettingsForm";
import { requireAuth } from "@/lib/auth";
import { getUserSettings } from "@/lib/settings";

export const metadata: Metadata = {
    title: "Settings | Dawnscroll",
};

export default async function SettingsPage() {
    const user = await requireAuth("/settings");
    const settings = await getUserSettings(user.id);

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Account
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Settings
                    </h1>
                    <p className="text-sm text-reading-text-muted">
                        Reading preferences follow your account across devices.
                    </p>
                </div>
                <SettingsForm
                    initialMode={settings.readingMode}
                    initialFontScale={settings.fontScale}
                />
            </div>
        </div>
    );
}
