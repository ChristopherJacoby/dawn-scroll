import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { getChapterFindings } from "@/lib/archaeology/queries";
import { refRangeInChapter } from "@/lib/archaeology/refs";

const CACHE =
    "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NUMBER = /^[1-9]\d{0,3}$/;

/**
 * GET /api/archaeology/by-passage?book=exodus&chapter=14[&verseStart=21][&verseEnd=31]
 * — summaries of the findings linked to that chapter, or to the given
 * verses of it.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const book = params.get("book") ?? "";
    const chapter = params.get("chapter") ?? "";
    const verseStart = params.get("verseStart");
    const verseEnd = params.get("verseEnd") ?? verseStart;

    if (!SLUG.test(book) || !NUMBER.test(chapter)) {
        return jsonError("Provide a book and chapter.", 400);
    }
    if (
        (verseStart !== null && !NUMBER.test(verseStart)) ||
        (verseEnd !== null && !NUMBER.test(verseEnd)) ||
        (verseStart === null && verseEnd !== null) ||
        Number(verseEnd) < Number(verseStart)
    ) {
        return jsonError("Verses must be a range of positive numbers.", 400);
    }

    try {
        const chapterNumber = Number(chapter);
        let findings = await getChapterFindings(book, chapterNumber);
        if (verseStart !== null) {
            const [from, to] = [Number(verseStart), Number(verseEnd)];
            findings = findings.filter((finding) =>
                finding.refs.some((ref) => {
                    if (ref.bookSlug !== book) return false;
                    const range = refRangeInChapter(ref, chapterNumber);
                    return (
                        range !== null &&
                        range.first <= to &&
                        (range.last === null || range.last >= from)
                    );
                }),
            );
        }
        return Response.json(
            { findings },
            { headers: { "Cache-Control": CACHE } },
        );
    } catch {
        return jsonError("Couldn't load findings. Please try again.", 500);
    }
}
