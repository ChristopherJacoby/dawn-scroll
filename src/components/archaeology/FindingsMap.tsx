"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { X } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { FindingCard } from "@/components/archaeology/FindingCard";
import { CREDIBILITY } from "@/lib/archaeology/credibility";
import type { FindingSummary } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

// OpenFreeMap: free vector tiles, no key; attribution comes with the tiles.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// Muted parchment tones so the basemap sits under the reading palette (the
// tiles' labels are dark, so the basemap stays light in every mode).
const PARCHMENT = "#efe7d4";
const WATER = "#c5ccc4";

// MapLibre adds its own positioning classes to marker elements, so these
// are added alongside them, never by assigning className.
const markerClasses = (strong: boolean) =>
    cn(
        "block h-4 w-4 cursor-pointer rounded-full border-2 shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus",
        // Filled for established/supported, hollow for debated/unverified.
        strong
            ? "border-[var(--reading-accent-contrast)] bg-[var(--reading-accent)]"
            : "border-[var(--reading-accent)] bg-[var(--reading-accent-contrast)]",
    ).split(" ");

function showSelection(
    markers: Map<string, HTMLButtonElement>,
    selected: string | null,
) {
    for (const [slug, element] of markers) {
        const isSelected = slug === selected;
        // A ring rather than a transform: MapLibre positions markers with
        // the element's transform.
        element.classList.toggle("ring-2", isSelected);
        element.classList.toggle("ring-[var(--reading-accent)]", isSelected);
        element.classList.toggle("ring-offset-2", isSelected);
        element.setAttribute("aria-pressed", String(isSelected));
    }
}

/**
 * The findings on a map: one marker per site; selecting a marker shows the
 * finding's card. The card grid below the map remains the list view.
 */
export function FindingsMap({ findings }: { findings: FindingSummary[] }) {
    const container = useRef<HTMLDivElement>(null);
    const markers = useRef(new Map<string, HTMLButtonElement>());
    const [selected, setSelected] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const elements = markers.current;
        let map: MapLibreMap | undefined;
        let cancelled = false;

        (async () => {
            const maplibre = await import("maplibre-gl");
            if (cancelled || !container.current) return;
            maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
            map = new maplibre.Map({
                container: container.current,
                style: STYLE_URL,
                center: [35.2, 31.5],
                zoom: 5,
                attributionControl: { compact: true },
                cooperativeGestures: true,
            });
            map.addControl(
                new maplibre.NavigationControl({ showCompass: false }),
                "top-right",
            );
            map.on("style.load", () => {
                if (map?.getLayer("background")) {
                    map.setPaintProperty(
                        "background",
                        "background-color",
                        PARCHMENT,
                    );
                }
                if (map?.getLayer("water")) {
                    map.setPaintProperty("water", "fill-color", WATER);
                }
            });

            const bounds = new maplibre.LngLatBounds();
            for (const finding of findings) {
                const strong =
                    finding.credibility === "established" ||
                    finding.credibility === "supported";
                const element = document.createElement("button");
                element.type = "button";
                element.classList.add(...markerClasses(strong));
                element.setAttribute("aria-pressed", "false");
                element.setAttribute(
                    "aria-label",
                    `${finding.title} (${CREDIBILITY[finding.credibility].label})`,
                );
                element.title = finding.title;
                element.addEventListener("click", (event) => {
                    event.stopPropagation();
                    setSelected(finding.slug);
                });
                elements.set(finding.slug, element);
                const point: [number, number] = [
                    finding.location.lng,
                    finding.location.lat,
                ];
                new maplibre.Marker({ element }).setLngLat(point).addTo(map);
                bounds.extend(point);
            }
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                    padding: 48,
                    maxZoom: 8,
                    duration: 0,
                });
            }
        })().catch(() => {
            if (!cancelled) setFailed(true);
        });

        return () => {
            cancelled = true;
            elements.clear();
            map?.remove();
        };
    }, [findings]);

    // Reflect the selection on the markers (they live outside React).
    useEffect(() => showSelection(markers.current, selected), [selected]);

    const finding = findings.find((f) => f.slug === selected) ?? null;

    if (failed) {
        return (
            <p className="rounded-lg border border-reading-divider bg-reading-surface p-4 text-sm text-reading-text-muted">
                The map couldn&rsquo;t load. The findings are listed below.
            </p>
        );
    }

    return (
        <section aria-label="Map of findings" className="relative">
            <div
                ref={container}
                className="h-80 w-full overflow-hidden rounded-lg border border-reading-border-strong bg-reading-bg-subtle md:h-[26rem]"
            />
            {finding && (
                <div className="absolute inset-x-2 bottom-2 z-10 max-w-sm md:left-3 md:right-auto">
                    <FindingCard
                        finding={finding}
                        className="pr-10 shadow-lg"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            markers.current.get(finding.slug)?.focus();
                            setSelected(null);
                        }}
                        aria-label="Close"
                        className="absolute right-2 top-2 rounded-sm p-1 text-reading-text-muted hover:bg-reading-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reading-focus"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </section>
    );
}
