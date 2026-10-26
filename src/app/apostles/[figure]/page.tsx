import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApostleChatLoader } from "@/components/chat/ApostleChatLoader";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { buttonVariants } from "@/components/ui/Button";
import { getApostle } from "@/lib/ai/apostles";
import { isAiConfigured } from "@/lib/ai/config";
import { remainingToday } from "@/lib/ai/usage";
import { getUser } from "@/lib/auth";

type Params = Promise<{ figure: string }>;

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const apostle = getApostle((await params).figure);
    return {
        title: apostle
            ? `${apostle.name} | Apostles | Dawnscroll`
            : "Apostles | Dawnscroll",
    };
}

export default async function ApostleChatPage({ params }: { params: Params }) {
    const apostle = getApostle((await params).figure);
    if (!apostle) notFound();
    if (!isAiConfigured()) notFound();

    const user = await getUser();
    if (!user) {
        const next = encodeURIComponent(`/apostles/${apostle.id}`);
        return (
            <div className="flex min-h-full w-full flex-col bg-reading-bg">
                <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-5 py-12 md:px-10 md:py-16">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                            Apostles
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-reading-text">
                            {apostle.name}
                        </h1>
                    </div>
                    <p className="text-reading-text">
                        {apostle.fact} Log in to talk with an AI portrayal of{" "}
                        {apostle.name}, grounded in Scripture and early church
                        tradition.
                    </p>
                    <div className="flex gap-3">
                        <Link
                            href={`/login?next=${next}`}
                            className={buttonVariants()}
                        >
                            Log in
                        </Link>
                        <Link
                            href={`/signup?next=${next}`}
                            className={buttonVariants({ variant: "secondary" })}
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const quota = await remainingToday(user.id, "apostle").catch(() => null);
    return (
        <PremiumGate feature="apostleMode">
            <ApostleChatLoader
                userId={user.id}
                apostle={apostle}
                initialQuota={quota}
            />
        </PremiumGate>
    );
}
