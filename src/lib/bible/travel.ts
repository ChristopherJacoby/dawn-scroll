/**
 * Travel-time estimates for journey maps (DS-148), from each leg's
 * straight-line distance and how it was traveled. Rates are ranges from
 * documented ancient travel (Casson, Travel in the Ancient World; ORBIS,
 * the Stanford geospatial model of the Roman world), so estimates are too.
 */

export type TravelMode = "foot" | "flocks" | "ship";

/** Kilometers a day, low to high. */
export const TRAVEL_RATES: Record<TravelMode, { low: number; high: number }> = {
    // A day's walk on ancient roads.
    foot: { low: 25, high: 32 },
    // Moving with herds and a household, "as the cattle ... and the
    // children be able to endure" (Genesis 33:14).
    flocks: { low: 10, high: 16 },
    // Sailing ships, slowed or sped by the wind.
    ship: { low: 90, high: 180 },
};

/** Overland routes wind; a road is about this much longer than a straight line. */
export const ROAD_FACTOR = 1.25;
/** Walking pace for trips shorter than a day, in km an hour. */
const HOURLY = { low: 4, high: 5 };

export interface TravelLeg {
    km: number;
    by: TravelMode;
}

export interface TravelEstimate {
    /** Straight-line distance between stops. */
    km: number;
    unit: "hours" | "days";
    min: number;
    max: number;
    modes: TravelMode[];
}

export function estimateTravel(legs: TravelLeg[]): TravelEstimate {
    const km = legs.reduce((sum, l) => sum + l.km, 0);
    const modes = [...new Set(legs.map((l) => l.by))];
    const routeKm = (l: TravelLeg) =>
        l.by === "ship" ? l.km : l.km * ROAD_FACTOR;
    const fast = legs.reduce(
        (sum, l) => sum + routeKm(l) / TRAVEL_RATES[l.by].high,
        0,
    );
    const slow = legs.reduce(
        (sum, l) => sum + routeKm(l) / TRAVEL_RATES[l.by].low,
        0,
    );

    if (modes.every((m) => m === "foot") && slow < 1) {
        const road = legs.reduce((sum, l) => sum + routeKm(l), 0);
        return {
            km,
            unit: "hours",
            min: Math.max(1, Math.round(road / HOURLY.high)),
            max: Math.max(1, Math.round(road / HOURLY.low)),
            modes,
        };
    }
    return {
        km,
        unit: "days",
        min: Math.max(1, Math.round(fast)),
        max: Math.max(1, Math.round(slow)),
        modes,
    };
}

const MODE_WORDS: Record<TravelMode, string> = {
    foot: "on foot",
    flocks: "with flocks and household",
    ship: "by ship",
};

/** "About 4–5 days on foot", "about 3 hours on foot", "about 40–70 days on foot and by ship". */
export function describeTravel(estimate: TravelEstimate): string {
    const { min, max, unit, modes } = estimate;
    const span = min === max ? `${min}` : `${min}–${max}`;
    const one = max === 1 ? unit.slice(0, -1) : unit;
    const how =
        modes.length === 1
            ? MODE_WORDS[modes[0]]
            : modes.map((m) => MODE_WORDS[m]).join(" and ");
    return `About ${span} ${one} ${how}`;
}

/** "111 km (69 miles)". */
export function describeDistance(km: number): string {
    const rounded = (n: number) => (n >= 100 ? Math.round(n / 10) * 10 : n);
    return `${rounded(km).toLocaleString("en-US")} km (${rounded(Math.round(km * 0.621371)).toLocaleString("en-US")} miles)`;
}
