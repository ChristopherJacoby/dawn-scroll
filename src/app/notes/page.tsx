import type { Metadata } from "next";
import { SortLinks } from "@/components/library/SortLinks";
import { NoteList } from "@/components/notes/NoteList";
import { requireAuth } from "@/lib/auth";
import { listNotes } from "@/lib/notes";
import { compareCanonical } from "@/lib/verse-ref";

export const metadata: Metadata = {
    title: "Notes | Dawnscroll",
};

const SORTS = [
    { value: "recent", label: "Recently edited" },
    { value: "book", label: "Bible order" },
] as const;

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string }>;
}) {
    await requireAuth("/notes");
    const [{ sort }, notes] = await Promise.all([searchParams, listNotes()]);
    const order = sort === "book" ? "book" : "recent";
    if (order === "book") notes.sort(compareCanonical);

    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                            Your library
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-reading-text">
                            Notes
                        </h1>
                    </div>
                    {notes.length > 1 && (
                        <SortLinks
                            label="Sort notes"
                            basePath="/notes"
                            current={order}
                            options={SORTS}
                        />
                    )}
                </div>
                <NoteList key={order} initialNotes={notes} />
            </div>
        </div>
    );
}
