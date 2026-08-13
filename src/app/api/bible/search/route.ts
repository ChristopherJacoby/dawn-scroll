import type { NextRequest } from "next/server";
import { searchKjv } from "@/lib/bible/queries";

const MAX_QUERY_LENGTH = 200;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseLimit(value: string | null) {
    if (!value || !/^\d+$/.test(value)) return DEFAULT_LIMIT;
    return Math.min(Math.max(Number(value), 1), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
    const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

    if (!query) {
        return Response.json({ query, results: [] });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return Response.json(
            {
                error: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
            },
            { status: 400 },
        );
    }

    try {
        const results = await searchKjv(query, limit);
        return Response.json({ query, results });
    } catch {
        return Response.json(
            { error: "Search is unavailable right now. Please try again." },
            { status: 500 },
        );
    }
}
