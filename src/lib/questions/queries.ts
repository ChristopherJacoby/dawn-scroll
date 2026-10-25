import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { ClaimRating } from "@/lib/roots/types";
import type { Question, QuestionSummary } from "./types";

const SUMMARY_COLUMNS = "slug, title, category, summary";

interface QuestionRow extends QuestionSummary {
    argument: string;
    critiques: string;
    standing: string;
    reviewed_on: string;
    question_claims: {
        claim: string;
        rating: ClaimRating;
        explanation: string;
    }[];
    question_quotes: {
        quote: string;
        speaker: string;
        role: string;
        source_position: number;
    }[];
    question_sources: { citation: string; url: string | null }[];
    related_questions: { position: number; questions: QuestionSummary }[];
}

const paragraphs = (text: string) => text.split(/\n{2,}/);

/** Every question, in catalog order. */
export async function listQuestions(): Promise<QuestionSummary[]> {
    const { data, error } = await createPublicClient()
        .from("questions")
        .select(SUMMARY_COLUMNS)
        .order("sort_order");
    if (error) throw error;
    return data as QuestionSummary[];
}

/** One question with everything its detail page shows, or null. */
export async function getQuestion(slug: string): Promise<Question | null> {
    const { data, error } = await createPublicClient()
        .from("questions")
        .select(
            `${SUMMARY_COLUMNS}, argument, critiques, standing, reviewed_on, question_claims(position, claim, rating, explanation), question_quotes(position, quote, speaker, role, source_position), question_sources(position, citation, url), related_questions!related_questions_question_id_fkey(position, questions!related_questions_related_question_id_fkey(${SUMMARY_COLUMNS}))`,
        )
        .eq("slug", slug)
        .order("position", { referencedTable: "question_claims" })
        .order("position", { referencedTable: "question_quotes" })
        .order("position", { referencedTable: "question_sources" })
        .order("position", { referencedTable: "related_questions" })
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as unknown as QuestionRow;
    return {
        slug: row.slug,
        title: row.title,
        category: row.category,
        summary: row.summary,
        argument: paragraphs(row.argument),
        critiques: paragraphs(row.critiques),
        standing: paragraphs(row.standing),
        claims: row.question_claims.map(({ claim, rating, explanation }) => ({
            claim,
            rating,
            explanation,
        })),
        quotes: row.question_quotes.map((q) => ({
            quote: q.quote,
            speaker: q.speaker,
            role: q.role,
            source: q.source_position,
        })),
        related: row.related_questions.map(({ questions }) => questions),
        sources: row.question_sources.map(({ citation, url }) => ({
            citation,
            url,
        })),
        reviewedOn: row.reviewed_on,
    };
}
