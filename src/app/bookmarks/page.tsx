import type { Metadata } from "next";
import { BookmarkList } from "@/components/bookmarks/BookmarkList";
import { SortLinks } from "@/components/library/SortLinks";
import { requireAuth } from "@/lib/auth";
import { listBookmarks } from "@/lib/bookmarks";
import { compareCanonical } from "@/lib/verse-ref";

export const metadata: Metadata = {
    title: "Bookmarks | Dawnscroll",
};

const SORTS = [
    { value: "recent", label: "Recently added" },
    { value: "book", label: "Bible order" },
] as const;

export default async function BookmarksPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string }>;
}) {
    await requireAuth("/bookmarks");
    const [{ sort }, bookmarks] = await Promise.all([
        searchParams,
        listBookmarks(),
    ]);
    const order = sort === "book" ? "book" : "recent";
    if (order === "book") bookmarks.sort(compareCanonical);

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                            Your library
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-reading-text">
                            Bookmarks
                        </h1>
                    </div>
                    {bookmarks.length > 1 && (
                        <SortLinks
                            label="Sort bookmarks"
                            basePath="/bookmarks"
                            current={order}
                            options={SORTS}
                        />
                    )}
                </div>

                <BookmarkList key={order} initialBookmarks={bookmarks} />
            </div>
        </div>
    );
}
