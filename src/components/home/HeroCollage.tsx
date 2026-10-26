import { X } from "lucide-react";
import { FindingCard } from "@/components/archaeology/FindingCard";
import { WordStudyCard } from "@/components/reader/WordStudy";
import type { FindingSummary } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";
import type {
    MorphologicalFeature,
    OriginalWord,
    StrongsEntry,
    WordMapping,
} from "@/lib/language/types";

export interface HeroWordStudy {
    mapping: WordMapping;
    word: OriginalWord;
    entry: StrongsEntry | null;
    features: MorphologicalFeature[] | null;
}

interface HeroCollageProps {
    study: HeroWordStudy | null;
    finding: FindingSummary | null;
}

// Each panel tilts on the same angle and steps down and right, so the
// three read as one diagonal. `rotate` and `scale` are separate CSS
// properties, so they compose with the rise animation's `transform`.
const panel =
    "absolute origin-top-left -rotate-6 scale-[0.6] animate-panel-rise rounded-lg border border-reading-border-strong bg-reading-surface-raised shadow-xl shadow-stone-night/15 sm:scale-[0.85] lg:scale-[0.78] xl:scale-90";

/**
 * Three real pieces of the app laid on a diagonal: Psalm 23
 * in the reader, the word study for "shepherd" opening from it, and an
 * archaeology find. They're built from the app's own components, so they
 * follow the reading mode. A picture, not controls: hidden from assistive
 * tech and inert.
 */
export function HeroCollage({ study, finding }: HeroCollageProps) {
    return (
        <div
            aria-hidden="true"
            inert
            className="relative -mx-5 h-[21rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent)] sm:h-[29rem] md:-mx-10 lg:mx-0 lg:-mr-10 lg:h-[33rem]"
        >
            <div className={cn(panel, "top-[7%] left-[4%] w-[19rem]")}>
                <ReaderPanel />
            </div>
            {study && (
                <div
                    className={cn(panel, "top-[31%] left-[33%]")}
                    style={{ animationDelay: "120ms" }}
                >
                    <WordStudyCard {...study} />
                </div>
            )}
            {finding && (
                <div
                    className={cn(
                        panel,
                        "top-[50%] left-[50%] w-[17rem] border-0 bg-transparent",
                    )}
                    style={{ animationDelay: "240ms" }}
                >
                    <FindingCard finding={finding} showContext />
                </div>
            )}
        </div>
    );
}

/** The opening of Psalm 23 as the reader shows it, verse 1 highlighted. */
function ReaderPanel() {
    return (
        <div className="flex flex-col gap-4 p-5 font-serif text-reading-text">
            <div className="flex flex-col gap-0.5 border-b border-reading-divider pb-3">
                <p className="font-sans text-[0.65rem] font-medium uppercase tracking-wide text-reading-text-muted">
                    King James Version
                </p>
                <p className="text-3xl leading-tight">Psalm 23</p>
            </div>
            <div className="flex flex-col gap-3 text-lg leading-relaxed">
                <p>
                    <Verse number={1} selected />
                    <span className="-mx-0.5 rounded-sm bg-highlight-yellow px-0.5">
                        The LORD is my{" "}
                        <span className="rounded-sm bg-reading-bg-subtle underline decoration-dotted decoration-2 underline-offset-[0.3em] decoration-[var(--reading-link)]">
                            shepherd
                        </span>
                        ; I shall not want.
                    </span>
                </p>
                <p>
                    <Verse number={2} />
                    He maketh me to lie down in green pastures: he leadeth me
                    beside the still waters.
                </p>
                <p>
                    <Verse number={3} />
                    He restoreth my soul: he leadeth me in the paths of
                    righteousness for his name&rsquo;s sake.
                </p>
            </div>
            <div className="flex items-center gap-1 self-start rounded-lg border border-reading-border-strong bg-reading-surface p-1 font-sans text-sm shadow-md">
                <span className="px-2 font-semibold">Psalm 23:1</span>
                <span className="h-5 w-px bg-reading-divider" />
                <span className="px-2">Highlight</span>
                <span className="px-2">Original</span>
                <span className="px-2">Note</span>
                <X className="mx-1 h-3.5 w-3.5 text-reading-text-muted" />
            </div>
        </div>
    );
}

function Verse({ number, selected }: { number: number; selected?: boolean }) {
    return (
        <sup className="mr-2 align-super">
            <span
                className={cn(
                    "rounded-sm px-0.5 font-sans text-xs font-semibold",
                    selected
                        ? "bg-reading-accent text-reading-accent-contrast"
                        : "text-reading-text-muted",
                )}
            >
                {number}
            </span>
        </sup>
    );
}
