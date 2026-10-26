import type { Metadata } from "next";
import { ActivePlanCard } from "@/components/plans/ActivePlanCard";
import { PlanCard } from "@/components/plans/PlanCard";
import { getUser } from "@/lib/auth";
import { getEnrolledPlans, listPlans } from "@/lib/reading-plans";

export const metadata: Metadata = {
    title: "Reading plans | Dawnscroll",
};

export default async function PlansPage() {
    const user = await getUser();
    const [plans, enrolled] = await Promise.all([
        listPlans(),
        user ? getEnrolledPlans() : Promise.resolve([]),
    ]);
    const enrolledIds = new Set(enrolled.map((e) => e.plan.id));
    const available = plans.filter((plan) => !enrolledIds.has(plan.id));

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Daily reading
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Reading plans
                    </h1>
                </div>

                {enrolled.length > 0 && (
                    <section
                        aria-labelledby="your-plans-heading"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="your-plans-heading"
                            className="text-xs font-medium uppercase tracking-wide text-reading-text-muted"
                        >
                            Your plans
                        </h2>
                        {enrolled.map((entry) => (
                            <ActivePlanCard key={entry.plan.id} entry={entry} />
                        ))}
                    </section>
                )}

                {available.length > 0 && (
                    <section
                        aria-labelledby="all-plans-heading"
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id="all-plans-heading"
                            className="text-xs font-medium uppercase tracking-wide text-reading-text-muted"
                        >
                            {enrolled.length > 0
                                ? "More plans"
                                : "Choose a plan"}
                        </h2>
                        {/* One row of three once there's room, rather than
                            two columns that strand the third plan. */}
                        <div className="grid gap-4 lg:grid-cols-3">
                            {available.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    signedIn={user !== null}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
