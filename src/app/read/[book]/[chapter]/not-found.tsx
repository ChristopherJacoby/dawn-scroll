import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function ReaderNotFound() {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16 md:px-10">
            <div className="border-l-2 border-reading-border-strong pl-6">
                <BookOpen className="mb-5 h-6 w-6 text-reading-accent" />
                <h1 className="font-serif text-3xl text-reading-text">
                    Passage unavailable
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-reading-text-muted">
                    The requested KJV passage is not available. The book,
                    chapter, or loaded translation data may be missing.
                </p>
                <Link
                    href="/read/john/1"
                    className="mt-6 inline-flex h-10 items-center rounded-md border border-reading-border-strong px-4 text-sm font-medium text-reading-accent transition-colors hover:bg-reading-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus focus-visible:ring-offset-2 focus-visible:ring-offset-reading-bg"
                >
                    Open John 1
                </Link>
            </div>
        </div>
    );
}
