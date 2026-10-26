import "server-only";
import type { TravelMode } from "./travel";
import data from "./journeys.json";

/**
 * Journeys for the reader's journey maps (DS-146), built by
 * scripts/generate-journeys.mjs from data/journeys/journeys.json with
 * places from OpenBible.info. Static and server-only: each chapter gets
 * just the journeys it shows.
 */

export interface JourneyStop {
    name: string;
    ref: { book: string; chapter: number; verse: number; label: string };
    lat: number;
    lng: number;
    /** False when the place's location is uncertain. */
    confident: boolean;
    /** A region (e.g. Egypt) rather than a town, placed at OpenBible's point for it. */
    region: boolean;
    /** How the traveler reached this stop; absent on the first. */
    by?: TravelMode;
    /** Where the location came from when it isn't OpenBible. */
    source?: string;
}

/** A point that only shapes the drawn route (e.g. "by way of Damascus"). */
export interface JourneyVia {
    via: string;
    lat: number;
    lng: number;
}

/** One way the journey may have gone; most journeys have just one. */
export interface JourneyRoute {
    /** What the route is called, e.g. "Arabia"; empty when it's the only one. */
    label: string;
    /** Who proposes the route and why; empty when it's the only one. */
    note: string;
    /** The archaeology finding about this route, if there is one. */
    finding?: { slug: string; title: string };
    points: (JourneyStop | JourneyVia)[];
    /** One per stop after the first, with its straight-line distance. */
    legs: { km: number; by: TravelMode }[];
}

export interface Journey {
    slug: string;
    title: string;
    travelers: string;
    summary: string;
    passage: {
        book: string;
        from: { chapter: number; verse: number };
        to: { chapter: number; verse: number };
        label: string;
    };
    /** The proposed routes where the way is disputed (the Exodus). */
    routes: JourneyRoute[];
    /** Where Scripture itself gives the time or distance. */
    scriptureTime: { ref: string; text: string }[];
}

const JOURNEYS = (data as unknown as { journeys: Journey[] }).journeys;

/**
 * Journeys with a marker in this chapter, and the verse it goes on: the
 * passage's first verse in its first chapter, then the first stop named
 * in each later chapter on any of its routes.
 */
export function getChapterJourneys(
    bookSlug: string,
    chapter: number,
): { verse: number; journey: Journey }[] {
    return JOURNEYS.flatMap((journey) => {
        const { book, from, to } = journey.passage;
        if (book !== bookSlug || chapter < from.chapter || chapter > to.chapter)
            return [];
        if (chapter === from.chapter) return [{ verse: from.verse, journey }];
        const verses = journey.routes
            .flatMap((route) => route.points)
            .filter(
                (p): p is JourneyStop =>
                    !("via" in p) &&
                    p.ref.book === bookSlug &&
                    p.ref.chapter === chapter,
            )
            .map((stop) => stop.ref.verse);
        return verses.length > 0
            ? [{ verse: Math.min(...verses), journey }]
            : [];
    });
}
