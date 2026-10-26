#!/usr/bin/env node
// Generates idempotent SQL for the Roots catalog from data/roots/traditions.json,
// validating every tradition first (verse references against the KJV,
// ratings, minimum counts, and that every [n] citation resolves and every
// source is cited):
//
//   node scripts/generate-roots-seed.mjs > data/roots/traditions.seed.sql
//   node scripts/generate-roots-seed.mjs --check-urls > /dev/null   # also fetch every source URL
//
// Production gets a snapshot of this output as a migration. Local
// `supabase db reset` runs migrations before seeds, when books don't exist
// yet, so the migration inserts no scripture refs there; this seed file
// (listed after kjv.seed.sql in supabase/config.toml) fills them in.

import { readFileSync } from "node:fs";
import { citedSources } from "../src/lib/roots/citations.ts";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const kjv = read("../data/kjv/kjv.normalized.json");
const { traditions } = read("../data/roots/traditions.json");

const RATINGS = new Set(["established", "supported", "debated", "unverified", "contradicted"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKER = /\[\d+\]/;

/** slug → { osisId, chapters: Map<chapter, verseCount> } */
const books = new Map(
  kjv.books.map((b) => [b.slug, { osisId: b.osisId, chapters: new Map() }]),
);
const byOsis = new Map([...books.values()].map((b) => [b.osisId, b]));
for (const v of kjv.verses) {
  const { chapters } = byOsis.get(v.book);
  chapters.set(v.chapter, Math.max(chapters.get(v.chapter) ?? 0, v.verse));
}

const errors = [];
const fail = (slug, message) => errors.push(`${slug}: ${message}`);

/** "18:13" → [18, 13], checked against the book's chapters and verses. */
function parsePoint(slug, book, text) {
  const match = /^(\d+):(\d+)$/.exec(text);
  if (!match) {
    fail(slug, `bad reference "${text}"`);
    return [0, 0];
  }
  const [chapter, verse] = [Number(match[1]), Number(match[2])];
  const verses = books.get(book)?.chapters.get(chapter);
  if (!verses || verse < 1 || verse > verses) {
    fail(slug, `${book} ${text} doesn't exist`);
  }
  return [chapter, verse];
}

const nonEmpty = (value) => typeof value === "string" && /\S/.test(value);
const paragraphs = (value) => Array.isArray(value) && value.length > 0 && value.every(nonEmpty);
// Mirror the table's length checks so content fails here, not mid-push.
const tooLong = (slug, field, value, max) => {
  if (typeof value === "string" && value.length > max) fail(slug, `${field} is over ${max} characters`);
};
// Citations belong in prose; a marker anywhere else would render as text.
const noMarker = (slug, field, value) => {
  if (MARKER.test(value ?? "")) fail(slug, `${field} has a citation marker; only prose and claim explanations may cite`);
};
const seen = new Set();

for (const t of traditions) {
  const slug = t.slug;
  if (!SLUG.test(slug ?? "") || seen.has(slug)) fail(slug, "bad or duplicate slug");
  seen.add(slug);
  for (const field of ["name", "summary"]) {
    if (!nonEmpty(t[field])) fail(slug, `missing ${field}`);
    noMarker(slug, field, t[field]);
  }
  if (!paragraphs(t.origin)) fail(slug, "origin must be a list of paragraphs");
  if (!paragraphs(t.earlyChurch)) fail(slug, "earlyChurch must be a list of paragraphs");
  tooLong(slug, "name", t.name, 80);
  tooLong(slug, "summary", t.summary, 300);
  tooLong(slug, "origin", (t.origin ?? []).join("\n\n"), 8000);
  tooLong(slug, "earlyChurch", (t.earlyChurch ?? []).join("\n\n"), 3000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.reviewedOn ?? "")) fail(slug, "reviewedOn must be YYYY-MM-DD");

  // Optional: another name ("Called Easter in English") and our position
  // on keeping the tradition, a headed section of cited prose.
  if (t.alsoCalled !== undefined) {
    if (!nonEmpty(t.alsoCalled)) fail(slug, "alsoCalled is empty");
    noMarker(slug, "alsoCalled", t.alsoCalled);
    tooLong(slug, "alsoCalled", t.alsoCalled, 80);
  }
  if (t.stance !== undefined) {
    if (!nonEmpty(t.stance.heading)) fail(slug, "stance needs a heading");
    if (!paragraphs(t.stance.paragraphs)) fail(slug, "stance.paragraphs must be a list of paragraphs");
    noMarker(slug, "stance heading", t.stance.heading);
    tooLong(slug, "stance heading", t.stance.heading, 100);
    tooLong(slug, "stance", (t.stance.paragraphs ?? []).join("\n\n"), 4000);
  }

  if (!(t.claims?.length >= 3)) fail(slug, "needs at least 3 claims");
  for (const c of t.claims ?? []) {
    if (!nonEmpty(c.claim) || !nonEmpty(c.explanation)) fail(slug, `incomplete claim "${c.claim}"`);
    if (!RATINGS.has(c.rating)) fail(slug, `bad rating "${c.rating}" on "${c.claim}"`);
    noMarker(slug, "claim", c.claim);
    tooLong(slug, "claim", c.claim, 200);
    tooLong(slug, "claim explanation", c.explanation, 1200);
  }

  if (!(t.timeline?.length >= 5)) fail(slug, "needs at least 5 timeline entries");
  (t.timeline ?? []).forEach((e, i, list) => {
    if (!Number.isInteger(e.year) || !nonEmpty(e.label) || !nonEmpty(e.event)) {
      fail(slug, `bad timeline entry "${e.label}"`);
    }
    if (i > 0 && e.year < list[i - 1].year) fail(slug, `timeline out of order at "${e.label}"`);
    noMarker(slug, "timeline event", e.event);
    tooLong(slug, "timeline label", e.label, 60);
    tooLong(slug, "timeline event", e.event, 300);
  });

  if (!(t.refs?.length >= 3)) fail(slug, "needs at least 3 scripture refs");
  t.parsedRefs = (t.refs ?? []).map((ref) => {
    if (!books.has(ref.book)) fail(slug, `unknown book "${ref.book}"`);
    if (!nonEmpty(ref.note)) fail(slug, `${ref.book} ${ref.from} has no note`);
    noMarker(slug, "scripture note", ref.note);
    tooLong(slug, "scripture note", ref.note, 300);
    const [cs, vs] = parsePoint(slug, ref.book, ref.from);
    const [ce, ve] = parsePoint(slug, ref.book, ref.to);
    if (ce < cs || (ce === cs && ve < vs)) fail(slug, `${ref.from}–${ref.to} runs backward`);
    return { book: ref.book, cs, vs, ce, ve, note: ref.note };
  });

  if (!(t.sources?.length >= 5)) fail(slug, "needs at least 5 sources");
  for (const s of t.sources ?? []) {
    if (!nonEmpty(s.citation)) fail(slug, "source without a citation");
    tooLong(slug, "citation", s.citation, 600);
    if (s.url !== null && !/^https:\/\/\S+$/.test(s.url ?? "")) {
      fail(slug, `bad source url "${s.url}"`);
    }
  }

  // Every marker must point at a source, and every source must be cited.
  const prose = [
    ...(t.origin ?? []),
    ...(t.earlyChurch ?? []),
    ...(t.stance?.paragraphs ?? []),
    ...(t.claims ?? []).map((c) => c.explanation),
  ].join("\n");
  const cited = citedSources(prose);
  const count = t.sources?.length ?? 0;
  for (const n of cited) if (n < 1 || n > count) fail(slug, `[${n}] cites a source that doesn't exist`);
  for (let n = 1; n <= count; n += 1) if (!cited.includes(n)) fail(slug, `source ${n} is never cited`);
}

// The table only checks a URL's shape; this catches dead or mistyped links.
if (process.argv.includes("--check-urls")) {
  const urls = new Set(traditions.flatMap((t) => (t.sources ?? []).flatMap((s) => (s.url ? [s.url] : []))));
  await Promise.all(
    [...urls].map(async (url) => {
      const response = await fetch(url, { headers: { "User-Agent": "dawnscroll-source-check" } }).catch(() => null);
      if (!response?.ok) errors.push(`${url}: ${response ? `HTTP ${response.status}` : "unreachable"}`);
    }),
  );
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

const q = (s) => (s === null ? "null" : `'${s.replaceAll("'", "''")}'`);
const rows = (list) => list.map((cells) => `  (${cells.join(", ")})`).join(",\n");
const slugList = traditions.map((t) => q(t.slug)).join(", ");
const children = ["tradition_claims", "tradition_timeline", "tradition_scripture_refs", "tradition_sources"];

const out = [
  "-- Generated by scripts/generate-roots-seed.mjs from data/roots/traditions.json; do not edit by hand.",
  "",
  "insert into public.traditions (slug, name, also_called, summary, origin, early_church, stance_heading, stance, sort_order, reviewed_on) values",
  rows(
    traditions.map((t, i) => [
      q(t.slug),
      q(t.name),
      q(t.alsoCalled ?? null),
      q(t.summary),
      q(t.origin.join("\n\n")),
      q(t.earlyChurch.join("\n\n")),
      q(t.stance?.heading ?? null),
      q(t.stance ? t.stance.paragraphs.join("\n\n") : null),
      i + 1,
      q(t.reviewedOn),
    ]),
  ),
  "on conflict (slug) do update set name = excluded.name, also_called = excluded.also_called,",
  "  summary = excluded.summary, origin = excluded.origin, early_church = excluded.early_church,",
  "  stance_heading = excluded.stance_heading, stance = excluded.stance,",
  "  sort_order = excluded.sort_order, reviewed_on = excluded.reviewed_on;",
  "",
  `delete from public.traditions where slug not in (${slugList});`,
  "",
  "-- Children are replaced wholesale so removed entries disappear too.",
  ...children.map(
    (table) => `delete from public.${table} where tradition_id in (select id from public.traditions where slug in (${slugList}));`,
  ),
  "",
  "insert into public.tradition_claims (tradition_id, position, claim, rating, explanation)",
  "select t.id, v.position, v.claim, v.rating, v.explanation",
  "from (values",
  rows(
    traditions.flatMap((t) =>
      t.claims.map((c, i) => [q(t.slug), i + 1, q(c.claim), q(c.rating), q(c.explanation)]),
    ),
  ),
  ") as v (slug, position, claim, rating, explanation)",
  "join public.traditions t on t.slug = v.slug;",
  "",
  "insert into public.tradition_timeline (tradition_id, position, year, label, event)",
  "select t.id, v.position, v.year, v.label, v.event",
  "from (values",
  rows(
    traditions.flatMap((t) =>
      t.timeline.map((e, i) => [q(t.slug), i + 1, e.year, q(e.label), q(e.event)]),
    ),
  ),
  ") as v (slug, position, year, label, event)",
  "join public.traditions t on t.slug = v.slug;",
  "",
  "insert into public.tradition_scripture_refs (tradition_id, position, book_id, chapter_start, verse_start, chapter_end, verse_end, note)",
  "select t.id, v.position, b.id, v.cs, v.vs, v.ce, v.ve, v.note",
  "from (values",
  rows(
    traditions.flatMap((t) =>
      t.parsedRefs.map((r, i) => [q(t.slug), i + 1, q(r.book), r.cs, r.vs, r.ce, r.ve, q(r.note)]),
    ),
  ),
  ") as v (slug, position, book, cs, vs, ce, ve, note)",
  "join public.traditions t on t.slug = v.slug",
  "join public.books b on b.slug = v.book;",
  "",
  "insert into public.tradition_sources (tradition_id, position, citation, url)",
  "select t.id, v.position, v.citation, v.url",
  "from (values",
  rows(
    traditions.flatMap((t) =>
      t.sources.map((s, i) => [q(t.slug), i + 1, q(s.citation), q(s.url)]),
    ),
  ),
  ") as v (slug, position, citation, url)",
  "join public.traditions t on t.slug = v.slug;",
  "",
];

process.stdout.write(out.join("\n"));
