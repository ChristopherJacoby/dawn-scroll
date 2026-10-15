import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type {
    CredibilityRating,
    Finding,
    FindingScriptureRef,
    FindingSummary,
} from "./types";

interface RefRow {
    chapter_start: number;
    verse_start: number;
    chapter_end: number;
    verse_end: number;
    books: { slug: string; name: string };
}

interface SummaryRow {
    id: number;
    slug: string;
    title: string;
    summary: string;
    site_name: string;
    location_lat: number | string;
    location_lng: number | string;
    credibility_rating: CredibilityRating;
    finding_scripture_refs: RefRow[];
}

interface FindingRow extends SummaryRow {
    description: string;
    credibility_note: string;
    reviewed_on: string;
    finding_sources: { citation: string; url: string | null }[];
    finding_timeline: { year: number; label: string; event: string }[];
}

const REFS =
    "finding_scripture_refs(position, chapter_start, verse_start, chapter_end, verse_end, books!inner(slug, name))";
const SUMMARY_COLUMNS = `id, slug, title, summary, site_name, location_lat, location_lng, credibility_rating, ${REFS}`;

function mapRef(row: RefRow): FindingScriptureRef {
    return {
        bookSlug: row.books.slug,
        bookName: row.books.name,
        chapterStart: row.chapter_start,
        verseStart: row.verse_start,
        chapterEnd: row.chapter_end,
        verseEnd: row.verse_end,
    };
}

function mapSummary(row: SummaryRow): FindingSummary {
    return {
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        siteName: row.site_name,
        // numeric columns can arrive as strings.
        location: {
            lat: Number(row.location_lat),
            lng: Number(row.location_lng),
        },
        credibility: row.credibility_rating,
        refs: row.finding_scripture_refs.map(mapRef),
    };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// chapter_start/chapter_end are smallint; larger numbers can't match.
const MAX_CHAPTER = 32767;

/** Ids of findings with a reference in this book (and chapter, if given). */
async function findingIdsForPassage(
    bookSlug: string,
    chapter?: number,
): Promise<number[]> {
    if (!SLUG.test(bookSlug)) return [];
    if (chapter !== undefined && !(chapter >= 1 && chapter <= MAX_CHAPTER)) {
        return [];
    }
    let query = createPublicClient()
        .from("finding_scripture_refs")
        .select("finding_id, books!inner(slug)")
        .eq("books.slug", bookSlug);
    if (chapter !== undefined) {
        query = query.lte("chapter_start", chapter).gte("chapter_end", chapter);
    }
    const { data, error } = await query;
    if (error) throw error;
    return [...new Set(data.map((row) => row.finding_id as number))];
}

export interface FindingFilters {
    book?: string;
    credibility?: CredibilityRating;
    /** 1-based. */
    page?: number;
    pageSize?: number;
}

/** A page of findings in catalog order, optionally filtered. */
export async function listFindings({
    book,
    credibility,
    page = 1,
    pageSize = 24,
}: FindingFilters = {}): Promise<{
    findings: FindingSummary[];
    total: number;
}> {
    const ids = book ? await findingIdsForPassage(book) : null;
    if (ids?.length === 0) return { findings: [], total: 0 };

    const client = createPublicClient();
    // Builders are lazy: the count query only runs if it's awaited.
    let pageQuery = client
        .from("findings")
        .select(SUMMARY_COLUMNS, { count: "exact" })
        .order("sort_order")
        .order("position", { referencedTable: "finding_scripture_refs" })
        .range((page - 1) * pageSize, page * pageSize - 1);
    let countQuery = client
        .from("findings")
        .select("id", { count: "exact", head: true });
    if (ids) {
        pageQuery = pageQuery.in("id", ids);
        countQuery = countQuery.in("id", ids);
    }
    if (credibility) {
        pageQuery = pageQuery.eq("credibility_rating", credibility);
        countQuery = countQuery.eq("credibility_rating", credibility);
    }

    const { data, error, count } = await pageQuery;
    // PGRST103: the page starts past the last row. That's an empty page,
    // not an error; count the matches so callers can still paginate.
    if (error?.code === "PGRST103") {
        const total = await countQuery;
        if (total.error) throw total.error;
        return { findings: [], total: total.count ?? 0 };
    }
    if (error) throw error;
    return {
        findings: (data as unknown as SummaryRow[]).map(mapSummary),
        total: count ?? 0,
    };
}

/** Findings with a reference touching this chapter, in catalog order. */
export async function getChapterFindings(
    bookSlug: string,
    chapter: number,
): Promise<FindingSummary[]> {
    const ids = await findingIdsForPassage(bookSlug, chapter);
    if (ids.length === 0) return [];
    const { data, error } = await createPublicClient()
        .from("findings")
        .select(SUMMARY_COLUMNS)
        .in("id", ids)
        .order("sort_order")
        .order("position", { referencedTable: "finding_scripture_refs" });
    if (error) throw error;
    return (data as unknown as SummaryRow[]).map(mapSummary);
}

/** One finding with everything its detail page shows, or null. */
export async function getFinding(slug: string): Promise<Finding | null> {
    const { data, error } = await createPublicClient()
        .from("findings")
        .select(
            `${SUMMARY_COLUMNS}, description, credibility_note, reviewed_on, finding_sources(position, citation, url), finding_timeline(position, year, label, event)`,
        )
        .eq("slug", slug)
        .order("position", { referencedTable: "finding_scripture_refs" })
        .order("position", { referencedTable: "finding_sources" })
        .order("position", { referencedTable: "finding_timeline" })
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as unknown as FindingRow;
    return {
        ...mapSummary(row),
        description: row.description.split(/\n{2,}/),
        credibilityNote: row.credibility_note,
        reviewedOn: row.reviewed_on,
        sources: row.finding_sources.map(({ citation, url }) => ({
            citation,
            url,
        })),
        timeline: row.finding_timeline.map(({ year, label, event }) => ({
            year,
            label,
            event,
        })),
    };
}

/** Books with at least one finding, in canonical order (for filters). */
export async function getFindingBooks(): Promise<
    { slug: string; name: string }[]
> {
    const { data, error } = await createPublicClient()
        .from("finding_scripture_refs")
        .select("books!inner(slug, name, book_order)");
    if (error) throw error;
    const books = new Map<
        string,
        { slug: string; name: string; order: number }
    >();
    for (const row of data as unknown as {
        books: { slug: string; name: string; book_order: number };
    }[]) {
        books.set(row.books.slug, {
            slug: row.books.slug,
            name: row.books.name,
            order: row.books.book_order,
        });
    }
    return [...books.values()]
        .sort((a, b) => a.order - b.order)
        .map(({ slug, name }) => ({ slug, name }));
}
