import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CredibilityBadge } from "@/components/archaeology/CredibilityBadge";
import { FindingCard } from "@/components/archaeology/FindingCard";
import { FindingFilters } from "@/components/archaeology/FindingFilters";
import { FindingsMap } from "@/components/archaeology/FindingsMap";
import {
    CREDIBILITY,
    CREDIBILITY_ORDER,
    isCredibilityRating,
} from "@/lib/archaeology/credibility";
import { getFindingBooks, listFindings } from "@/lib/archaeology/queries";

export const metadata: Metadata = {
    title: "Archaeology | Dawnscroll",
    description:
        "Archaeological finds that bear on the Bible, each with an honest credibility rating and sources.",
};

const PAGE_SIZE = 24;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ArchaeologyPageProps {
    searchParams: Promise<{
        book?: string;
        credibility?: string;
        page?: string;
    }>;
}

export default async function ArchaeologyPage({
    searchParams,
}: ArchaeologyPageProps) {
    const params = await searchParams;
    const book = params.book && SLUG.test(params.book) ? params.book : null;
    const credibility = isCredibilityRating(params.credibility)
        ? params.credibility
        : null;
    const page = /^[1-9]\d{0,3}$/.test(params.page ?? "")
        ? Number(params.page)
        : 1;

    const [books, { findings, total }] = await Promise.all([
        getFindingBooks(),
        listFindings({
            book: book ?? undefined,
            credibility: credibility ?? undefined,
            page,
            pageSize: PAGE_SIZE,
        }),
    ]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const pageHref = (n: number) => {
        const query = new URLSearchParams();
        if (book) query.set("book", book);
        if (credibility) query.set("credibility", credibility);
        if (n > 1) query.set("page", String(n));
        const text = query.toString();
        return text ? `/archaeology?${text}` : "/archaeology";
    };
    // A page past the end (an old link, or the catalog shrank): go to the last.
    if (page > pages) redirect(pageHref(pages));

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex max-w-2xl flex-col gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Explore
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Archaeology
                    </h1>
                    <p className="text-reading-text">
                        Finds that bear on the biblical text, from inscriptions
                        naming its kings to claims that haven&rsquo;t held up.
                        Each has a rating that says how well it&rsquo;s
                        supported, and the sources to check it yourself.
                    </p>
                </div>

                <details className="group max-w-2xl rounded-lg border border-reading-divider bg-reading-surface p-4 text-sm">
                    <summary className="cursor-pointer font-medium text-reading-text">
                        How the ratings work
                    </summary>
                    <dl className="mt-3 flex flex-col gap-3">
                        {CREDIBILITY_ORDER.map((rating) => (
                            <div
                                key={rating}
                                className="flex flex-col items-start gap-1 sm:flex-row sm:gap-3"
                            >
                                <dt className="sm:w-28">
                                    <CredibilityBadge rating={rating} />
                                </dt>
                                <dd className="text-reading-text">
                                    {CREDIBILITY[rating].description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-reading-text-muted">
                        Each rating judges one claim, named at the start of the
                        finding&rsquo;s explanation. Archaeology can test
                        people, places and events; it can&rsquo;t test
                        theological claims or miracles.
                    </p>
                </details>

                <FindingFilters
                    books={books}
                    book={book}
                    credibility={credibility}
                />

                {/* Always rendered, so every change (even to none) is announced. */}
                <p className="sr-only" aria-live="polite">
                    {total === 0
                        ? "No findings match"
                        : total === 1
                          ? "1 finding"
                          : `${total} findings`}
                </p>
                {findings.length > 0 ? (
                    <>
                        <FindingsMap
                            // A new map per result set; markers are built once.
                            key={findings.map((f) => f.slug).join()}
                            findings={findings}
                        />
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {findings.map((finding) => (
                                <li key={finding.slug} className="flex">
                                    <FindingCard
                                        finding={finding}
                                        as="h2"
                                        showContext
                                        className="w-full"
                                    />
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="rounded-lg border border-reading-divider bg-reading-surface p-6 text-reading-text-muted">
                        No findings match these filters.{" "}
                        <Link href="/archaeology" className="text-reading-link">
                            Show all findings
                        </Link>
                    </p>
                )}

                {pages > 1 && (
                    <nav
                        aria-label="Pages"
                        className="flex items-center justify-between text-sm"
                    >
                        {page > 1 ? (
                            <Link
                                href={pageHref(page - 1)}
                                className="text-reading-link"
                            >
                                Previous
                            </Link>
                        ) : (
                            <span />
                        )}
                        <span className="text-reading-text-muted">
                            Page {page} of {pages}
                        </span>
                        {page < pages ? (
                            <Link
                                href={pageHref(page + 1)}
                                className="text-reading-link"
                            >
                                Next
                            </Link>
                        ) : (
                            <span />
                        )}
                    </nav>
                )}
            </div>
        </div>
    );
}
