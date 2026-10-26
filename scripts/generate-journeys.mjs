#!/usr/bin/env node
// Builds src/lib/bible/journeys.json for the reader's journey maps from the
// curated data/journeys/journeys.json, placing every stop with OpenBible.info's
// Bible Geocoding Data (CC BY 4.0) and checking every verse reference
// against our KJV, including that the verse names the place as given:
//
//   node scripts/generate-journeys.mjs
//
// Each leg's straight-line distance is computed here; travel time is
// estimated at render time (src/lib/bible/travel.ts).

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const DIR = `${ROOT}data/journeys`;
const RAW = `${DIR}/raw`;
const MANIFEST_PATH = `${DIR}/source-manifest.json`;
const OUT_PATH = `${ROOT}src/lib/bible/journeys.json`;

const MODES = new Set(["foot", "flocks", "ship"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// OpenBible's own threshold: a vote total of 500 or more is high confidence.
const CONFIDENT = 500;

async function loadPlaces() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const { source } = manifest;
  mkdirSync(RAW, { recursive: true });
  const path = `${RAW}/${source.file}`;
  if (!existsSync(path)) {
    process.stderr.write(`Downloading ${source.title}…\n`);
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (source.sha256 && source.sha256 !== sha256) {
    throw new Error(`${source.file}: checksum changed (expected ${source.sha256}, got ${sha256}). Review the new upstream data, then update the manifest.`);
  }
  if (!source.sha256) {
    source.sha256 = sha256;
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 4)}\n`);
  }
  const places = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const place = JSON.parse(line);
    places.set(place.friendly_id, place);
  }
  return places;
}

const stripTags = (html) => (html ?? "").replace(/<[^>]+>/g, "");

/**
 * A place's coordinates and confidence. OpenBible orders identifications
 * by its own time-weighted score, so the first is its leading one; a stop
 * can name another (`identification: "Jabal al Lawz"`), matched against
 * the identification's description.
 */
function locate(place, name) {
  const candidates = place.identifications ?? [];
  const matches = name ? candidates.filter((i) => stripTags(i.resolutions?.[0]?.description) === name) : candidates.slice(0, 1);
  if (matches.length !== 1) return null;
  const [identification] = matches;
  const lonlat = identification.resolutions?.[0]?.lonlat;
  if (!lonlat) return null;
  const [lng, lat] = lonlat.split(",").map(Number);
  const votes = identification.score?.vote_total ?? 0;
  return { lat, lng, confident: votes >= CONFIDENT, region: (place.types ?? []).includes("region") };
}

const kjv = JSON.parse(readFileSync(`${ROOT}data/kjv/kjv.normalized.json`, "utf8"));
const slugByOsis = new Map(kjv.books.map((b) => [b.osisId, b.slug]));
const bookName = new Map(kjv.books.map((b) => [b.slug, b.name]));
const verseText = new Map(kjv.verses.map((v) => [`${slugByOsis.get(v.book)} ${v.chapter}:${v.verse}`, v.text]));

/** "genesis 12:6" → { book, chapter, verse }, or null when it doesn't exist. */
function parseRef(ref) {
  const match = /^([a-z0-9-]+) (\d+):(\d+)$/.exec(ref ?? "");
  if (!match || !verseText.has(ref)) return null;
  return { book: match[1], chapter: Number(match[2]), verse: Number(match[3]) };
}

const toRad = (d) => (d * Math.PI) / 180;
/** Great-circle distance in kilometers. */
function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const errors = [];
const fail = (slug, message) => errors.push(`${slug}: ${message}`);

/** A route's points in order: stops, plus via points that only shape the line. */
function routePoints(slug, label, stops) {
  const where = label ? `${slug} (${label})` : slug;
  const points = [];
  // Which place each set of coordinates came from on this route.
  const placeAt = new Map();
  let stopIndex = 0;
  for (const [i, s] of stops.entries()) {
    if (s.via) {
      if (i === 0 || i === stops.length - 1) fail(where, `via "${s.via}" can't start or end the route`);
      if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) {
        fail(where, `via "${s.via}" needs lat and lng`);
        continue;
      }
      points.push({ via: s.via, lat: s.lat, lng: s.lng });
      continue;
    }
    // A place OpenBible doesn't have (Nuweiba) is given directly, with
    // where its coordinates came from, and is never marked certain.
    let located;
    if (s.at) {
      if (!Number.isFinite(s.at.lat) || !Number.isFinite(s.at.lng) || !s.source?.trim()) {
        fail(where, `stop "${s.name}" needs at.lat, at.lng and a source`);
        continue;
      }
      located = { lat: s.at.lat, lng: s.at.lng, confident: false, region: false };
    } else {
      const place = places.get(s.key);
      located = place && locate(place, s.identification);
      if (!located) {
        fail(where, `no location for OpenBible place "${s.key}"${s.identification ? ` as "${s.identification}"` : ""}`);
        continue;
      }
    }
    const ref = parseRef(s.ref);
    if (!ref) fail(where, `stop "${s.name}" has a bad reference "${s.ref}"`);
    else if (!verseText.get(s.ref).toLowerCase().includes(String(s.kjv).toLowerCase())) {
      fail(where, `${s.ref} doesn't name "${s.kjv}"`);
    }
    // The map gives a place one marker; two places sharing a point (as
    // OpenBible's Gilead and Penuel do) would hide one of them.
    const place = s.at ? `at ${s.source}` : s.key;
    const at = `${located.lng},${located.lat}`;
    if (placeAt.has(at) && placeAt.get(at) !== place) {
      fail(where, `"${place}" and "${placeAt.get(at)}" are at the same point; pick a place with its own location`);
    }
    placeAt.set(at, place);
    const first = stopIndex++ === 0;
    if (!first && !MODES.has(s.by)) fail(where, `stop "${s.name}" needs by: foot, flocks or ship`);
    points.push({
      name: s.name,
      ref: ref && { ...ref, label: `${bookName.get(ref.book)} ${ref.chapter}:${ref.verse}` },
      lat: located.lat,
      lng: located.lng,
      // `certain` overrides OpenBible's votes where its doubt is about
      // something else (e.g. Rhodes the island vs Rhodes the city).
      confident: s.certain === true || located.confident,
      region: located.region,
      by: first ? undefined : s.by,
      // Credited in the modal, e.g. "Nuweiba from Wikidata (Q1011488)".
      source: s.at ? s.source : undefined,
    });
  }
  if (points.filter((p) => !p.via).length < 2) fail(where, "needs at least two stops");
  return points;
}

/** Legs between consecutive stops, through any via points between them. */
function routeLegs(points) {
  const legs = [];
  let distance = 0;
  let start = null;
  for (const p of points) {
    if (start) distance += haversine(start, p);
    if (start && !p.via) {
      legs.push({ km: Math.round(distance), by: p.by });
      distance = 0;
    }
    start = p;
  }
  return legs;
}

const places = await loadPlaces();
const findings = new Map(
  JSON.parse(readFileSync(`${ROOT}data/archaeology/findings.json`, "utf8")).findings.map((f) => [f.slug, f.title]),
);
const { journeys } = JSON.parse(readFileSync(`${DIR}/journeys.json`, "utf8"));
const seen = new Set();
const out = [];

for (const j of journeys) {
  const slug = j.slug;
  if (!SLUG.test(slug ?? "") || seen.has(slug)) fail(slug, "bad or duplicate slug");
  seen.add(slug);
  for (const field of ["title", "travelers", "summary"]) {
    if (typeof j[field] !== "string" || !j[field].trim()) fail(slug, `missing ${field}`);
  }
  const from = parseRef(`${j.passage?.book} ${j.passage?.from}`);
  const to = parseRef(`${j.passage?.book} ${j.passage?.to}`);
  if (!from || !to) fail(slug, "passage doesn't exist in the KJV");

  // Most journeys have one route; a disputed one (the Exodus) lists each
  // proposed route with a label and a note on who proposes it.
  const routes = j.routes ?? [{ label: "", note: "", stops: j.stops }];
  if (j.routes && j.stops) fail(slug, "has both stops and routes");
  const routesOut = routes.map((r) => {
    if (j.routes && (!r.label?.trim() || !r.note?.trim())) fail(slug, "each route needs a label and a note");
    if (r.finding && !findings.has(r.finding)) fail(slug, `no archaeology finding "${r.finding}"`);
    const points = routePoints(slug, r.label, r.stops ?? []);
    return {
      label: r.label,
      note: r.note,
      finding: r.finding ? { slug: r.finding, title: findings.get(r.finding) } : undefined,
      points: points.map(({ lat, lng, ...rest }) => ({ ...rest, lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) })),
      legs: routeLegs(points),
    };
  });

  const scriptureTime = (j.scriptureTime ?? []).map((t) => {
    const ref = parseRef(t.ref);
    if (!ref) fail(slug, `scriptureTime has a bad reference "${t.ref}"`);
    return { ref: ref && `${bookName.get(ref.book)} ${ref.chapter}:${ref.verse}`, text: t.text };
  });

  out.push({
    slug,
    title: j.title,
    travelers: j.travelers,
    summary: j.summary,
    passage: from && to && {
      book: from.book,
      from: { chapter: from.chapter, verse: from.verse },
      to: { chapter: to.chapter, verse: to.verse },
      label: `${bookName.get(from.book)} ${from.chapter}:${from.verse}–${to.chapter === from.chapter ? "" : `${to.chapter}:`}${to.verse}`,
    },
    routes: routesOut,
    scriptureTime,
  });
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
writeFileSync(OUT_PATH, `${JSON.stringify({ journeys: out })}\n`);
process.stderr.write(`Wrote ${OUT_PATH} (${out.length} journeys)\n`);
