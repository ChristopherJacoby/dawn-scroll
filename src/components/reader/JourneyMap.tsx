"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { ExpressionSpecification, Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { Journey, JourneyStop } from "@/lib/bible/journeys";
import { cn } from "@/lib/cn";

// The same basemap and parchment tones as the archaeology map.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const PARCHMENT = "#efe7d4";
const WATER = "#c5ccc4";
const ROUTE = "#5c4a2a";
// A marker's height (h-6), and its width with one number.
const MARKER = 24;
// Room around the route for the stop markers, their names and the controls.
const FIT = { padding: 56, maxZoom: 10 };

/**
 * Modern roads, railways, borders, built-up areas, parks and place names.
 * Hidden so the map shows the land and the journey's own stops; seas and
 * rivers keep their names.
 */
const MODERN =
    /^(highway|road|railway|tunnel|aeroway|airport|boundary|label_|building|landuse|park)/;

const isStop = (p: Journey["points"][number]): p is JourneyStop =>
    !("via" in p);

/** Each leg as a line through its via points, tagged with how it was traveled. */
function routeFeatures(journey: Journey) {
    const features: GeoJSON.Feature<GeoJSON.LineString, { by: string }>[] = [];
    let line: [number, number][] = [];
    for (const point of journey.points) {
        line.push([point.lng, point.lat]);
        if (isStop(point) && line.length > 1) {
            features.push({
                type: "Feature",
                properties: { by: point.by ?? "foot" },
                geometry: { type: "LineString", coordinates: line },
            });
            line = [[point.lng, point.lat]];
        }
    }
    return features;
}

/** A list qualifier, as in "Greece (probably Corinth)". */
const QUALIFIER = /\s*\(.*\)$/;

/**
 * The places the journey stops at, each with its stop numbers in order, so
 * a place visited twice gets one marker ("8 · 10") and one name. The name
 * drops list qualifiers, and prefers a stop named plainly: "Macedonia (by
 * way of Philippi)" and a later stop at Philippi are named "Philippi".
 */
function places(journey: Journey) {
    const byPlace = new Map<
        string,
        { stop: JourneyStop; numbers: number[]; name: string }
    >();
    journey.points.filter(isStop).forEach((stop, i) => {
        const key = `${stop.lng},${stop.lat}`;
        const place = byPlace.get(key);
        if (!place) {
            byPlace.set(key, { stop, numbers: [i + 1], name: stop.name });
            return;
        }
        place.numbers.push(i + 1);
        if (QUALIFIER.test(place.name) && !QUALIFIER.test(stop.name))
            place.name = stop.name;
    });
    return [...byPlace.values()].map((place) => ({
        ...place,
        name: place.name.replace(QUALIFIER, ""),
    }));
}

// Stop names' size in px, and the gap kept between a name and its marker.
const NAME_SIZE = 12;
const NAME_GAP = 6;

/**
 * Where a stop's name may go, in order of preference: toward the middle of
 * the map first so names at the edges aren't cut off, then below, above,
 * and outward. Offsets are in ems, clear of a marker `width` px wide.
 */
function namePlacement(
    toward: "east" | "west",
    width: number,
): ExpressionSpecification {
    const across = (width / 2 + NAME_GAP) / NAME_SIZE;
    const down = (MARKER / 2 + NAME_GAP) / NAME_SIZE;
    const east = ["left", [across, 0]];
    const west = ["right", [-across, 0]];
    const [first, last] = toward === "east" ? [east, west] : [west, east];
    return [
        "literal",
        [...first, "top", [0, down], "bottom", [0, -down], ...last],
    ];
}

/**
 * The journey's route on a map: solid over land, dashed by sea, with
 * numbered stops (hollow where the location is uncertain). Loaded only
 * when a journey is opened.
 */
export function JourneyMap({ journey }: { journey: Journey }) {
    const container = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let map: MapLibreMap | undefined;
        let cancelled = false;

        (async () => {
            const maplibre = await import("maplibre-gl");
            if (cancelled || !container.current) return;
            maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
            const bounds = new maplibre.LngLatBounds();
            for (const p of journey.points) bounds.extend([p.lng, p.lat]);
            const middle = bounds.getCenter().lng;
            const count = journey.points.filter(isStop).length;
            const stops = places(journey);
            map = new maplibre.Map({
                container: container.current,
                style: STYLE_URL,
                bounds,
                fitBoundsOptions: FIT,
                attributionControl: { compact: true },
                cooperativeGestures: true,
            });
            map.addControl(
                new maplibre.NavigationControl({ showCompass: false }),
                "top-right",
            );

            const markers = stops.map(({ stop, numbers, name }) => {
                const element = document.createElement("span");
                // MapLibre adds its own classes to marker elements, so ours are
                // added alongside them.
                element.classList.add(
                    ...cn(
                        "flex h-6 min-w-6 items-center justify-center rounded-full border-2 px-1 font-sans text-[0.7rem] font-semibold shadow-sm",
                        stop.confident
                            ? "border-[#f7f0df] bg-[#5c4a2a] text-[#f7f0df]"
                            : "border-[#5c4a2a] bg-[#f7f0df] text-[#5c4a2a]",
                    ).split(" "),
                );
                element.textContent = numbers.join(" · ");
                element.title = name;
                new maplibre.Marker({ element })
                    .setLngLat([stop.lng, stop.lat])
                    .addTo(map!);
                return element;
            });

            map.on("load", () => {
                if (!map) return;
                if (map.getLayer("background")) {
                    map.setPaintProperty(
                        "background",
                        "background-color",
                        PARCHMENT,
                    );
                }
                if (map.getLayer("water"))
                    map.setPaintProperty("water", "fill-color", WATER);
                for (const { id } of map.getStyle().layers) {
                    if (MODERN.test(id))
                        map.setLayoutProperty(id, "visibility", "none");
                }
                map.addSource("route", {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: routeFeatures(journey),
                    },
                });
                map.addLayer({
                    id: "route-land",
                    type: "line",
                    source: "route",
                    filter: ["!=", ["get", "by"], "ship"],
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: { "line-color": ROUTE, "line-width": 3 },
                });
                map.addLayer({
                    id: "route-sea",
                    type: "line",
                    source: "route",
                    filter: ["==", ["get", "by"], "ship"],
                    layout: { "line-join": "round" },
                    paint: {
                        "line-color": ROUTE,
                        "line-width": 2.5,
                        "line-dasharray": [2, 2],
                    },
                });
                // The markers are HTML, which label placement can't see, so
                // each gets an invisible footprint of its size that the names
                // keep clear of.
                const widths = markers.map((m) =>
                    Math.max(m.offsetWidth, MARKER),
                );
                widths.forEach((width, i) =>
                    map!.addImage(`footprint-${i}`, {
                        width,
                        height: MARKER,
                        data: new Uint8Array(width * MARKER * 4),
                    }),
                );
                map.addSource("stops", {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: stops.map(({ stop, numbers, name }, i) => ({
                            type: "Feature",
                            properties: {
                                index: i,
                                name,
                                // Where the journey starts and ends is named first.
                                rank:
                                    numbers[0] === 1 || numbers.includes(count)
                                        ? 0
                                        : 1,
                            },
                            geometry: {
                                type: "Point",
                                coordinates: [stop.lng, stop.lat],
                            },
                        })),
                    },
                });
                // Stop names; MapLibre drops any that would collide.
                map.addLayer({
                    id: "stop-names",
                    type: "symbol",
                    source: "stops",
                    layout: {
                        "text-field": ["get", "name"],
                        "text-font": ["Noto Sans Regular"],
                        "text-size": NAME_SIZE,
                        "text-variable-anchor-offset": [
                            "match",
                            ["get", "index"],
                            ...stops.flatMap(({ stop }, i) => [
                                i,
                                namePlacement(
                                    stop.lng < middle ? "east" : "west",
                                    widths[i],
                                ),
                            ]),
                            namePlacement("east", MARKER),
                            // The spread hides the label/output pairs from
                            // MapLibre's tuple types.
                        ] as unknown as ExpressionSpecification,
                        "text-justify": "auto",
                        "symbol-sort-key": ["get", "rank"],
                    },
                    paint: {
                        "text-color": ROUTE,
                        "text-halo-color": PARCHMENT,
                        "text-halo-width": 1.5,
                    },
                });
                // Above the names, so the footprints are placed first.
                map.addLayer({
                    id: "stop-footprints",
                    type: "symbol",
                    source: "stops",
                    layout: {
                        "icon-image": [
                            "concat",
                            "footprint-",
                            ["to-string", ["get", "index"]],
                        ],
                        "icon-allow-overlap": true,
                    },
                });
                // The modal may still be settling when the map is made.
                map.resize();
                map.fitBounds(bounds, { ...FIT, duration: 0 });
            });
        })().catch(() => {
            if (!cancelled) setFailed(true);
        });

        return () => {
            cancelled = true;
            map?.remove();
        };
    }, [journey]);

    if (failed) {
        return (
            <p className="rounded-md border border-reading-divider bg-reading-surface p-4 text-sm text-reading-text-muted">
                The map couldn&rsquo;t load. The stops are listed below.
            </p>
        );
    }
    return (
        <div
            ref={container}
            role="region"
            aria-label={`Map of ${journey.title}`}
            className="h-64 w-full overflow-hidden rounded-md border border-reading-divider bg-[#efe7d4] sm:h-80"
        />
    );
}
