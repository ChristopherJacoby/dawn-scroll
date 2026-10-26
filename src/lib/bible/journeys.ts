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
    /** A region (e.g. Egypt) rather than a town; placed at its center. */
    region: boolean;
    /** How the traveler reached this stop; absent on the first. */
    by?: TravelMode;
}

/** A point that only shapes the drawn route (e.g. "by way of Damascus"). */
export interface JourneyVia {
    via: string;
    lat: number;
    lng: number;
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
    points: (JourneyStop | JourneyVia)[];
    /** One per stop after the first, with its straight-line distance. */
    legs: { km: number; by: TravelMode }[];
    /** Where Scripture itself gives the time or distance. */
    scriptureTime: { ref: string; text: string }[];
}

const JOURNEYS = (data as unknown as { journeys: Journey[] }).journeys;

/**
 * Journeys with a marker in this chapter, and the verse it goes on: the
 * passage's first verse in its first chapter, then the first stop named
 * in each later chapter.
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
        const stop = journey.points.find(
            (p): p is JourneyStop =>
                !("via" in p) &&
                p.ref.book === bookSlug &&
                p.ref.chapter === chapter,
        );
        return stop ? [{ verse: stop.ref.verse, journey }] : [];
    });
}
