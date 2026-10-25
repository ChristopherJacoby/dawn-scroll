import { jsonError } from "@/lib/api";
import { listQuestions } from "@/lib/questions/queries";
import { QUESTION_CATEGORIES } from "@/lib/questions/ratings";
import type { QuestionCategory } from "@/lib/questions/types";

const CACHE =
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

/**
 * GET /api/questions — every question's slug, title and summary, grouped
 * by category in catalog order.
 */
export async function GET() {
    try {
        const questions = await listQuestions();
        const categories = (
            Object.keys(QUESTION_CATEGORIES) as QuestionCategory[]
        ).map((category) => ({
            category,
            label: QUESTION_CATEGORIES[category],
            questions: questions.filter((q) => q.category === category),
        }));
        return Response.json(
            { categories },
            { headers: { "Cache-Control": CACHE } },
        );
    } catch {
        return jsonError("Couldn't load questions. Please try again.", 500);
    }
}
