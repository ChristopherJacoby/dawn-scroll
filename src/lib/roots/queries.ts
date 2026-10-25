import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { ClaimRating, Tradition, TraditionSummary } from "./types";

interface TraditionRow extends TraditionSummary {
    origin: string;
    early_church: string;
    reviewed_on: string;
    tradition_claims: {
        claim: string;
        rating: ClaimRating;
        explanation: string;
    }[];
    tradition_timeline: { year: number; label: string; event: string }[];
    tradition_scripture_refs: {
        chapter_start: number;
        verse_start: number;
        chapter_end: number;
        verse_end: number;
        note: string;
        books: { slug: string; name: string };
    }[];
    tradition_sources: { citation: string; url: string | null }[];
}

const paragraphs = (text: string) => text.split(/\n{2,}/);

/** Every tradition, in catalog order. */
export async function listTraditions(): Promise<TraditionSummary[]> {
    const { data, error } = await createPublicClient()
        .from("traditions")
        .select("slug, name, summary")
        .order("sort_order");
    if (error) throw error;
    return data as TraditionSummary[];
}

/** One tradition with everything its detail page shows, or null. */
export async function getTradition(slug: string): Promise<Tradition | null> {
    const { data, error } = await createPublicClient()
        .from("traditions")
        .select(
            "slug, name, summary, origin, early_church, reviewed_on, tradition_claims(position, claim, rating, explanation), tradition_timeline(position, year, label, event), tradition_scripture_refs(position, chapter_start, verse_start, chapter_end, verse_end, note, books!inner(slug, name)), tradition_sources(position, citation, url)",
        )
        .eq("slug", slug)
        .order("position", { referencedTable: "tradition_claims" })
        .order("position", { referencedTable: "tradition_timeline" })
        .order("position", { referencedTable: "tradition_scripture_refs" })
        .order("position", { referencedTable: "tradition_sources" })
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as unknown as TraditionRow;
    return {
        slug: row.slug,
        name: row.name,
        summary: row.summary,
        origin: paragraphs(row.origin),
        earlyChurch: paragraphs(row.early_church),
        claims: row.tradition_claims.map(({ claim, rating, explanation }) => ({
            claim,
            rating,
            explanation,
        })),
        timeline: row.tradition_timeline.map(({ year, label, event }) => ({
            year,
            label,
            event,
        })),
        refs: row.tradition_scripture_refs.map((ref) => ({
            bookSlug: ref.books.slug,
            bookName: ref.books.name,
            chapterStart: ref.chapter_start,
            verseStart: ref.verse_start,
            chapterEnd: ref.chapter_end,
            verseEnd: ref.verse_end,
            note: ref.note,
        })),
        sources: row.tradition_sources.map(({ citation, url }) => ({
            citation,
            url,
        })),
        reviewedOn: row.reviewed_on,
    };
}
