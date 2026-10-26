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

/** The place's leading identification: coordinates and confidence. */
function locate(place) {
  const identification = place.identifications?.[0];
  const lonlat = identification?.resolutions?.[0]?.lonlat;
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

const places = await loadPlaces();
const { journeys } = JSON.parse(readFileSync(`${DIR}/journeys.json`, "utf8"));
const errors = [];
const fail = (slug, message) => errors.push(`${slug}: ${message}`);
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

  // Route points in order: stops, plus via points that only shape the line.
  const points = [];
  for (const [i, s] of (j.stops ?? []).entries()) {
    if (s.via) {
      if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) fail(slug, `via "${s.via}" needs lat and lng`);
      points.push({ via: s.via, lat: s.lat, lng: s.lng });
      continue;
    }
    const place = places.get(s.key);
    const located = place && locate(place);
    if (!located) {
      fail(slug, `no location for OpenBible place "${s.key}"`);
      continue;
    }
    const ref = parseRef(s.ref);
    if (!ref) fail(slug, `stop "${s.name}" has a bad reference "${s.ref}"`);
    else if (!verseText.get(s.ref).toLowerCase().includes(String(s.kjv).toLowerCase())) {
      fail(slug, `${s.ref} doesn't name "${s.kjv}"`);
    }
    if (i > 0 && !MODES.has(s.by)) fail(slug, `stop "${s.name}" needs by: foot, flocks or ship`);
    points.push({
      name: s.name,
      ref: ref && { ...ref, label: `${bookName.get(ref.book)} ${ref.chapter}:${ref.verse}` },
      lat: located.lat,
      lng: located.lng,
      // `certain` overrides OpenBible's votes where its doubt is about
      // something else (e.g. Rhodes the island vs Rhodes the city).
      confident: s.certain === true || located.confident,
      region: located.region,
      by: i > 0 ? s.by : undefined,
    });
  }
  if (points.filter((p) => !p.via).length < 2) fail(slug, "needs at least two stops");

  // Legs between consecutive stops, through any via points between them.
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
    points: points.map(({ lat, lng, ...rest }) => ({ ...rest, lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) })),
    legs,
    scriptureTime,
  });
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
writeFileSync(OUT_PATH, `${JSON.stringify({ journeys: out })}\n`);
process.stderr.write(`Wrote ${OUT_PATH} (${out.length} journeys)\n`);
