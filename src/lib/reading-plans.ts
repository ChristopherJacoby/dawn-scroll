import "server-only";
import { getUser } from "@/lib/auth";
import { nextDay, type PlanReading } from "@/lib/plan-progress";
import { fail, ok, type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";

export interface ReadingPlan {
    id: number;
    slug: string;
    name: string;
    description: string;
    durationDays: number;
}

export interface CompletedDay {
    dayNumber: number;
    completedAt: string;
}

/** A plan the user follows, with progress and the next day's readings. */
export interface EnrolledPlan {
    plan: ReadingPlan;
    startedAt: string;
    completed: CompletedDay[];
    /** First incomplete day, or null when the plan is finished. */
    currentDay: number | null;
    readings: PlanReading[];
}

const PLAN_COLUMNS = "id, slug, name, description, duration_days";

interface PlanRow {
    id: number;
    slug: string;
    name: string;
    description: string;
    duration_days: number;
}

function mapPlan(row: PlanRow): ReadingPlan {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        durationDays: row.duration_days,
    };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The public plan catalog, shortest first. */
export async function listPlans(): Promise<ReadingPlan[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("reading_plans")
        .select(PLAN_COLUMNS)
        .order("duration_days", { ascending: true });
    if (error) throw error;
    return (data as PlanRow[]).map(mapPlan);
}

async function getPlan(slug: unknown): Promise<ReadingPlan | null> {
    if (typeof slug !== "string" || !SLUG.test(slug)) return null;
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("reading_plans")
        .select(PLAN_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
    if (error) throw error;
    return data ? mapPlan(data as PlanRow) : null;
}

async function getDayReadings(
    planId: number,
    dayNumber: number,
): Promise<PlanReading[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("reading_plan_readings")
        .select("start_chapter, end_chapter, books!inner(slug, name)")
        .eq("plan_id", planId)
        .eq("day_number", dayNumber)
        .order("position", { ascending: true });
    if (error) throw error;
    return (
        data as unknown as {
            start_chapter: number;
            end_chapter: number;
            books: { slug: string; name: string };
        }[]
    ).map((row) => ({
        bookSlug: row.books.slug,
        bookName: row.books.name,
        startChapter: row.start_chapter,
        endChapter: row.end_chapter,
    }));
}

/** The signed-in user's plans with progress, most recently started first. */
export async function getEnrolledPlans(): Promise<EnrolledPlan[]> {
    const supabase = await createClient();
    const [enrollments, progress] = await Promise.all([
        supabase
            .from("user_reading_plans")
            .select(`started_at, reading_plans!inner(${PLAN_COLUMNS})`)
            .order("started_at", { ascending: false }),
        supabase
            .from("user_reading_progress")
            .select("plan_id, day_number, completed_at")
            .order("day_number", { ascending: true }),
    ]);
    if (enrollments.error) throw enrollments.error;
    if (progress.error) throw progress.error;

    return Promise.all(
        (
            enrollments.data as unknown as {
                started_at: string;
                reading_plans: PlanRow;
            }[]
        ).map(async (row) => {
            const plan = mapPlan(row.reading_plans);
            const completed = progress.data
                .filter((p) => p.plan_id === plan.id)
                .map((p) => ({
                    dayNumber: p.day_number,
                    completedAt: p.completed_at,
                }));
            const currentDay = nextDay(
                completed.map((c) => c.dayNumber),
                plan.durationDays,
            );
            return {
                plan,
                startedAt: row.started_at,
                completed,
                currentDay,
                readings: currentDay
                    ? await getDayReadings(plan.id, currentDay)
                    : [],
            };
        }),
    );
}

/** The user's progress in one plan (null when not enrolled). */
export async function getPlanProgress(slug: unknown): Promise<
    Result<{
        plan: ReadingPlan;
        enrolled: boolean;
        completed: CompletedDay[];
        currentDay: number | null;
    }>
> {
    if (!(await getUser())) return fail(401, "Sign in to see your progress.");
    try {
        const plan = await getPlan(slug);
        if (!plan) return fail(404, "Reading plan not found.");
        const supabase = await createClient();
        const [enrollment, progress] = await Promise.all([
            supabase
                .from("user_reading_plans")
                .select("plan_id")
                .eq("plan_id", plan.id)
                .maybeSingle(),
            supabase
                .from("user_reading_progress")
                .select("day_number, completed_at")
                .eq("plan_id", plan.id)
                .order("day_number", { ascending: true }),
        ]);
        if (enrollment.error) throw enrollment.error;
        if (progress.error) throw progress.error;
        const completed = progress.data.map((p) => ({
            dayNumber: p.day_number,
            completedAt: p.completed_at,
        }));
        return ok({
            plan,
            enrolled: enrollment.data !== null,
            completed,
            currentDay: nextDay(
                completed.map((c) => c.dayNumber),
                plan.durationDays,
            ),
        });
    } catch {
        return fail(500, "Couldn't load your progress. Please try again.");
    }
}

// ── Mutations shared by the API routes and the Server Actions ────────────
// All run as the signed-in user; RLS scopes every row to them.

/** Start following a plan (idempotent). */
export async function enroll(slug: unknown): Promise<Result<null>> {
    if (!(await getUser())) return fail(401, "Sign in to start a plan.");
    try {
        const plan = await getPlan(slug);
        if (!plan) return fail(404, "Reading plan not found.");
        const supabase = await createClient();
        const { error } = await supabase
            .from("user_reading_plans")
            .insert({ plan_id: plan.id });
        if (error && error.code !== "23505") throw error;
        return ok(null, error ? 200 : 201);
    } catch {
        return fail(500, "Couldn't start the plan. Please try again.");
    }
}

/** Stop following a plan; its progress is deleted with it. */
export async function leave(slug: unknown): Promise<Result<null>> {
    if (!(await getUser())) return fail(401, "Sign in to manage plans.");
    try {
        const plan = await getPlan(slug);
        if (!plan) return fail(404, "Reading plan not found.");
        const supabase = await createClient();
        const { error } = await supabase
            .from("user_reading_plans")
            .delete()
            .eq("plan_id", plan.id);
        if (error) throw error;
        return ok(null, 204);
    } catch {
        return fail(500, "Couldn't leave the plan. Please try again.");
    }
}

function parseDay(value: unknown, plan: ReadingPlan): number | null {
    const day = typeof value === "string" ? Number(value) : value;
    return typeof day === "number" &&
        Number.isInteger(day) &&
        day >= 1 &&
        day <= plan.durationDays
        ? day
        : null;
}

/** Mark a day complete (idempotent) or, with `complete: false`, undo it. */
export async function setDayComplete(
    slug: unknown,
    dayValue: unknown,
    complete: boolean,
): Promise<Result<null>> {
    if (!(await getUser())) return fail(401, "Sign in to track your reading.");
    try {
        const plan = await getPlan(slug);
        if (!plan) return fail(404, "Reading plan not found.");
        const day = parseDay(dayValue, plan);
        if (day === null) return fail(400, "That day isn't part of the plan.");
        const supabase = await createClient();
        if (!complete) {
            const { error } = await supabase
                .from("user_reading_progress")
                .delete()
                .eq("plan_id", plan.id)
                .eq("day_number", day);
            if (error) throw error;
            return ok(null, 204);
        }
        const { error } = await supabase
            .from("user_reading_progress")
            .insert({ plan_id: plan.id, day_number: day });
        if (!error) return ok(null, 201);
        if (error.code === "23505") return ok(null, 200);
        // Progress requires enrollment (composite foreign key).
        if (error.code === "23503") {
            return fail(409, "Start the plan before tracking it.");
        }
        throw error;
    } catch {
        return fail(500, "Couldn't save your progress. Please try again.");
    }
}
