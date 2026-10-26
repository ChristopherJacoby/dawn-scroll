"use client";

import { MapPinned } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Journey, JourneyStop } from "@/lib/bible/journeys";
import {
    describeDistance,
    describeTravel,
    estimateTravel,
} from "@/lib/bible/travel";
import { cn } from "@/lib/cn";

// MapLibre is large; load it only when a journey is opened.
const JourneyMap = dynamic(
    () => import("./JourneyMap").then((m) => m.JourneyMap),
    {
        ssr: false,
        loading: () => (
            <div className="h-64 w-full animate-pulse rounded-md bg-reading-bg-subtle sm:h-80" />
        ),
    },
);

const isStop = (p: Journey["points"][number]): p is JourneyStop =>
    !("via" in p);

/**
 * A small map marker beside a verse where a journey begins (or continues
 * into a new chapter); tapping it opens the journey's map, stops and
 * travel time.
 */
export function JourneyMarker({ journey }: { journey: Journey }) {
    const [open, setOpen] = useState(false);
    const stops = journey.points.filter(isStop);
    const vias = journey.points.filter((p) => "via" in p);
    const estimate = estimateTravel(journey.legs);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Map: ${journey.title}`}
                title={journey.title}
                className={cn(
                    "ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-sm align-middle text-reading-accent transition-colors",
                    "hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
                )}
            >
                <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <Modal
                open={open}
                onOpenChange={setOpen}
                title={journey.title}
                description={`${journey.travelers} · ${journey.passage.label}`}
                className="max-h-[90vh] max-w-2xl overflow-y-auto"
            >
                <div className="flex flex-col gap-5 px-6 pb-6 font-sans">
                    <div className="flex flex-col gap-2">
                        <p className="font-serif text-lg leading-relaxed text-reading-text">
                            {journey.summary}
                        </p>
                        <Link
                            href={`/read/${journey.passage.book}/${journey.passage.from.chapter}#verse-${journey.passage.from.verse}`}
                            onClick={() => setOpen(false)}
                            className="self-start text-sm text-reading-link"
                        >
                            Read {journey.passage.label}
                        </Link>
                    </div>
                    {open && <JourneyMap journey={journey} />}

                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                Distance
                            </dt>
                            <dd className="text-reading-text">
                                About {describeDistance(estimate.km)} between
                                stops
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                Time on the road
                            </dt>
                            <dd className="text-reading-text">
                                {describeTravel(estimate)}
                            </dd>
                        </div>
                    </dl>

                    {journey.scriptureTime.length > 0 && (
                        <div className="flex flex-col gap-1 text-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                What Scripture says
                            </p>
                            <ul className="flex flex-col gap-1">
                                {journey.scriptureTime.map((t) => (
                                    <li
                                        key={t.ref + t.text}
                                        className="text-reading-text"
                                    >
                                        {t.text}{" "}
                                        <span className="text-reading-text-muted">
                                            ({t.ref})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                            Stops
                        </p>
                        <ol className="flex flex-col gap-1.5 text-sm">
                            {stops.map((stop, i) => (
                                <li
                                    key={`${stop.name}-${i}`}
                                    className="flex items-baseline gap-2"
                                >
                                    <span className="w-5 shrink-0 text-right font-semibold tabular-nums text-reading-text-muted">
                                        {i + 1}
                                    </span>
                                    <span className="text-reading-text">
                                        {stop.name}
                                        {i > 0 && stop.by === "ship" && (
                                            <span className="text-reading-text-muted">
                                                {" "}
                                                · by ship
                                            </span>
                                        )}
                                        {!stop.confident && (
                                            <span className="text-reading-text-muted">
                                                {" "}
                                                · location uncertain
                                            </span>
                                        )}
                                    </span>
                                    <Link
                                        href={`/read/${stop.ref.book}/${stop.ref.chapter}#verse-${stop.ref.verse}`}
                                        onClick={() => setOpen(false)}
                                        className="ml-auto shrink-0 text-reading-link"
                                    >
                                        {stop.ref.label}
                                    </Link>
                                </li>
                            ))}
                        </ol>
                        {vias.length > 0 && (
                            <p className="text-xs text-reading-text-muted">
                                The route between stops is approximate:{" "}
                                {vias
                                    .map((v) =>
                                        "via" in v ? v.via.toLowerCase() : "",
                                    )
                                    .join("; ")}
                                .
                            </p>
                        )}
                    </div>

                    <p className="border-t border-reading-divider pt-3 text-xs leading-relaxed text-reading-text-muted">
                        Distances are straight lines between stops. Times are
                        estimates at documented ancient rates (about 25–32 km a
                        day on foot, 10–16 with flocks, 90–180 by ship), with
                        roads a quarter longer than the straight line, and leave
                        out time spent at each stop. Rates from Lionel
                        Casson&rsquo;s <cite>Travel in the Ancient World</cite>{" "}
                        and{" "}
                        <a
                            href="https://orbis.stanford.edu/"
                            className="text-reading-link"
                            rel="noreferrer"
                        >
                            ORBIS
                        </a>
                        , Stanford&rsquo;s model of travel in the Roman world.
                        Place locations from{" "}
                        <a
                            href="https://www.openbible.info/geo/"
                            className="text-reading-link"
                            rel="noreferrer"
                        >
                            OpenBible.info
                        </a>{" "}
                        (CC BY 4.0).
                    </p>
                </div>
            </Modal>
        </>
    );
}
