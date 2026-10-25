import type { Metadata } from "next";
import Link from "next/link";
import { ScholarChatLoader } from "@/components/chat/ScholarChatLoader";
import { buttonVariants } from "@/components/ui/Button";
import type { PassageRef } from "@/lib/ai/chat";
import { isAiConfigured } from "@/lib/ai/config";
import { remainingToday } from "@/lib/ai/usage";
import { getUser } from "@/lib/auth";
import { bookName } from "@/lib/bible/references";

export const metadata: Metadata = {
    title: "Scholar | Dawnscroll",
    description: "Ask about the history and culture behind the Bible.",
};

type Params = { book?: string; chapter?: string; verse?: string };

/** The passage named in the URL (from the reader), if it's a real one. */
function passageFromParams({
    book,
    chapter,
    verse,
}: Params): PassageRef | null {
    const chapterNumber = Number(chapter);
    const verseNumber = Number(verse);
    if (
        !book ||
        !bookName(book) ||
        !Number.isInteger(chapterNumber) ||
        chapterNumber < 1
    ) {
        return null;
    }
    return {
        book,
        chapter: chapterNumber,
        ...(Number.isInteger(verseNumber) &&
            verseNumber > 0 && { verse: verseNumber }),
    };
}

function Notice({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-5 py-12 md:px-10 md:py-16">
                <h1 className="font-serif text-4xl leading-tight text-reading-text">
                    {title}
                </h1>
                {children}
            </div>
        </div>
    );
}

export default async function ScholarPage({
    searchParams,
}: {
    searchParams: Promise<Params>;
}) {
    const [user, params] = await Promise.all([getUser(), searchParams]);

    if (!isAiConfigured()) {
        return (
            <Notice title="Scholar">
                <p className="text-reading-text">
                    Scholar chat isn&rsquo;t available yet. Check back soon.
                </p>
            </Notice>
        );
    }

    if (!user) {
        const query = new URLSearchParams(
            Object.entries(params).filter(
                (entry): entry is [string, string] =>
                    typeof entry[1] === "string",
            ),
        ).toString();
        const next = encodeURIComponent(`/scholar${query ? `?${query}` : ""}`);
        return (
            <Notice title="Scholar">
                <p className="text-reading-text">
                    Ask about the customs, laws, festivals, places and people of
                    the biblical world, with answers that cite the passages they
                    rely on. Log in to start a conversation.
                </p>
                <div className="flex gap-3">
                    <Link
                        href={`/login?next=${next}`}
                        className={buttonVariants()}
                    >
                        Log in
                    </Link>
                    <Link
                        href={`/signup?next=${next}`}
                        className={buttonVariants({ variant: "secondary" })}
                    >
                        Create an account
                    </Link>
                </div>
            </Notice>
        );
    }

    const quota = await remainingToday(user.id, "scholar").catch(() => null);
    return (
        <ScholarChatLoader
            passage={passageFromParams(params)}
            initialQuota={quota}
        />
    );
}
