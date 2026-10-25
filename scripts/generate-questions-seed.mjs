#!/usr/bin/env node
// Generates idempotent SQL for Hard Questions from data/questions/questions.json,
// validating every question first (categories, ratings, minimum counts, that
// every [n] citation and quote source resolves and every source is cited, and
// that related questions exist and are listed both ways):
//
//   node scripts/generate-questions-seed.mjs > data/questions/questions.seed.sql
//   node scripts/generate-questions-seed.mjs --check-urls > /dev/null   # also fetch every source URL
//                                                                       # and find each quote in its source
//
// Production gets a snapshot of this output as a migration; the seed file is
// listed in supabase/config.toml for local `supabase db reset`.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { citedSources } from "../src/lib/roots/citations.ts";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const { questions } = read("../data/questions/questions.json");

const CATEGORIES = new Set(["life", "universe"]);
const RATINGS = new Set(["established", "supported", "debated", "unverified", "contradicted"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKER = /\[\d+\]/;
const MAX_QUOTE_WORDS = 45;

const errors = [];
const fail = (slug, message) => errors.push(`${slug}: ${message}`);

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
const slugs = new Set(questions.map((q) => q.slug));
const seen = new Set();

for (const q of questions) {
  const slug = q.slug;
  if (!SLUG.test(slug ?? "") || seen.has(slug)) fail(slug, "bad or duplicate slug");
  seen.add(slug);
  for (const field of ["title", "summary"]) {
    if (!nonEmpty(q[field])) fail(slug, `missing ${field}`);
    noMarker(slug, field, q[field]);
  }
  if (!CATEGORIES.has(q.category)) fail(slug, `bad category "${q.category}"`);
  for (const field of ["argument", "critiques", "standing"]) {
    if (!paragraphs(q[field])) fail(slug, `${field} must be a list of paragraphs`);
  }
  tooLong(slug, "title", q.title, 120);
  tooLong(slug, "summary", q.summary, 300);
  tooLong(slug, "argument", (q.argument ?? []).join("\n\n"), 6000);
  tooLong(slug, "critiques", (q.critiques ?? []).join("\n\n"), 6000);
  tooLong(slug, "standing", (q.standing ?? []).join("\n\n"), 3000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.reviewedOn ?? "")) fail(slug, "reviewedOn must be YYYY-MM-DD");

  // One rated claim each for the observation, the scientific claim and the
  // inference, at least.
  if (!(q.claims?.length >= 3)) fail(slug, "needs at least 3 claims");
  for (const c of q.claims ?? []) {
    if (!nonEmpty(c.claim) || !nonEmpty(c.explanation)) fail(slug, `incomplete claim "${c.claim}"`);
    if (!RATINGS.has(c.rating)) fail(slug, `bad rating "${c.rating}" on "${c.claim}"`);
    noMarker(slug, "claim", c.claim);
    tooLong(slug, "claim", c.claim, 200);
    tooLong(slug, "claim explanation", c.explanation, 1200);
  }

  const count = q.sources?.length ?? 0;
  if (!(count >= 5)) fail(slug, "needs at least 5 sources");
  for (const s of q.sources ?? []) {
    if (!nonEmpty(s.citation)) fail(slug, "source without a citation");
    tooLong(slug, "citation", s.citation, 600);
    if (s.url !== null && !/^https:\/\/\S+$/.test(s.url ?? "")) {
      fail(slug, `bad source url "${s.url}"`);
    }
  }

  if (!(q.quotes?.length >= 2)) fail(slug, "needs at least 2 quotes");
  for (const quote of q.quotes ?? []) {
    for (const field of ["quote", "speaker", "role"]) {
      if (!nonEmpty(quote[field])) fail(slug, `quote is missing ${field}`);
    }
    noMarker(slug, "quote", quote.quote);
    tooLong(slug, "quote", quote.quote, 400);
    tooLong(slug, "quote speaker", quote.speaker, 120);
    tooLong(slug, "quote role", quote.role, 160);
    if ((quote.quote ?? "").split(/\s+/).length > MAX_QUOTE_WORDS) {
      fail(slug, `quote by ${quote.speaker} is over ${MAX_QUOTE_WORDS} words`);
    }
    if (!Number.isInteger(quote.source) || quote.source < 1 || quote.source > count) {
      fail(slug, `quote by ${quote.speaker} cites a source that doesn't exist`);
    } else if (!q.sources[quote.source - 1].url) {
      fail(slug, `quote by ${quote.speaker} must come from a source with a URL, so it can be checked`);
    }
  }

  for (const related of q.related ?? []) {
    if (related === slug) fail(slug, "relates to itself");
    else if (!slugs.has(related)) fail(slug, `related question "${related}" doesn't exist`);
    else if (!questions.find((other) => other.slug === related).related?.includes(slug)) {
      fail(slug, `related question "${related}" doesn't list it back`);
    }
  }

  // Every marker must point at a source, and every source must be cited,
  // in prose or by a quote.
  const prose = [...(q.argument ?? []), ...(q.critiques ?? []), ...(q.standing ?? []), ...(q.claims ?? []).map((c) => c.explanation)].join("\n");
  const cited = new Set([...citedSources(prose), ...(q.quotes ?? []).map((quote) => quote.source)]);
  for (const n of cited) if (n < 1 || n > count) fail(slug, `[${n}] cites a source that doesn't exist`);
  for (let n = 1; n <= count; n += 1) if (!cited.has(n)) fail(slug, `source ${n} is never cited`);
}

// Quotes are compared ignoring case, punctuation style and spacing: curly vs
// straight quotes, dash variants, and the capital a pull-quote starts with.
const normalize = (text) =>
  text
    .normalize("NFKC")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[∼~]/g, "~")
    .replace(/-\s*\n\s*/g, "")
    .replace(/[\s ]+/g, " ")
    .replace(/^\W+|\W+$/g, "")
    .toLowerCase();

// Fetched with curl rather than fetch(): some hosts (PubMed Central among
// them) answer Node's fetch with a bot-check page but serve curl normally.
function sourceText(url) {
  const body = execFileSync(
    "curl",
    ["-sSfL", "--max-time", "40", "-A", "Mozilla/5.0 (dawnscroll-source-check)", url],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  if (body.subarray(0, 4).toString() === "%PDF") {
    const dir = mkdtempSync(join(tmpdir(), "dawnscroll-quote-"));
    try {
      writeFileSync(join(dir, "source.pdf"), body);
      return execFileSync("pdftotext", [join(dir, "source.pdf"), "-"], { maxBuffer: 64 * 1024 * 1024 }).toString();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  const html = body.toString("utf8");
  if (/<title>[^<]*(Checking your browser|Just a moment)/i.test(html)) {
    throw new Error("answered with a bot check, so its quotes can't be verified; try again later");
  }
  const named = { nbsp: " ", quot: '"', amp: "&", apos: "'", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…" };
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

if (process.argv.includes("--check-urls")) {
  const texts = new Map();
  const urls = new Set(questions.flatMap((q) => (q.sources ?? []).flatMap((s) => (s.url ? [s.url] : []))));
  for (const url of urls) {
    try {
      texts.set(url, normalize(sourceText(url)));
    } catch (error) {
      errors.push(`${url}: ${error.message.split("\n")[0]}`);
    }
  }
  for (const q of questions) {
    for (const quote of q.quotes ?? []) {
      const url = q.sources?.[quote.source - 1]?.url;
      const text = url && texts.get(url);
      if (text && !text.includes(normalize(quote.quote).replace(/^\[?t\]?here/, "here"))) {
        fail(q.slug, `quote by ${quote.speaker} not found verbatim at ${url}`);
      }
    }
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

const sq = (s) => (s === null ? "null" : `'${s.replaceAll("'", "''")}'`);
const rows = (list) => list.map((cells) => `  (${cells.join(", ")})`).join(",\n");
const slugList = questions.map((q) => sq(q.slug)).join(", ");
const children = ["question_claims", "question_quotes", "question_sources", "related_questions"];

const out = [
  "-- Generated by scripts/generate-questions-seed.mjs from data/questions/questions.json; do not edit by hand.",
  "",
  "insert into public.questions (slug, title, category, summary, argument, critiques, standing, sort_order, reviewed_on) values",
  rows(
    questions.map((q, i) => [
      sq(q.slug),
      sq(q.title),
      sq(q.category),
      sq(q.summary),
      sq(q.argument.join("\n\n")),
      sq(q.critiques.join("\n\n")),
      sq(q.standing.join("\n\n")),
      i + 1,
      sq(q.reviewedOn),
    ]),
  ),
  "on conflict (slug) do update set title = excluded.title, category = excluded.category,",
  "  summary = excluded.summary, argument = excluded.argument, critiques = excluded.critiques,",
  "  standing = excluded.standing, sort_order = excluded.sort_order, reviewed_on = excluded.reviewed_on;",
  "",
  `delete from public.questions where slug not in (${slugList});`,
  "",
  "-- Children are replaced wholesale so removed entries disappear too.",
  ...children.map(
    (table) => `delete from public.${table} where question_id in (select id from public.questions where slug in (${slugList}));`,
  ),
  "",
  "insert into public.question_claims (question_id, position, claim, rating, explanation)",
  "select q.id, v.position, v.claim, v.rating, v.explanation",
  "from (values",
  rows(questions.flatMap((q) => q.claims.map((c, i) => [sq(q.slug), i + 1, sq(c.claim), sq(c.rating), sq(c.explanation)]))),
  ") as v (slug, position, claim, rating, explanation)",
  "join public.questions q on q.slug = v.slug;",
  "",
  "insert into public.question_quotes (question_id, position, quote, speaker, role, source_position)",
  "select q.id, v.position, v.quote, v.speaker, v.role, v.source_position",
  "from (values",
  rows(questions.flatMap((q) => q.quotes.map((x, i) => [sq(q.slug), i + 1, sq(x.quote), sq(x.speaker), sq(x.role), x.source]))),
  ") as v (slug, position, quote, speaker, role, source_position)",
  "join public.questions q on q.slug = v.slug;",
  "",
  "insert into public.question_sources (question_id, position, citation, url)",
  "select q.id, v.position, v.citation, v.url",
  "from (values",
  rows(questions.flatMap((q) => q.sources.map((s, i) => [sq(q.slug), i + 1, sq(s.citation), sq(s.url)]))),
  ") as v (slug, position, citation, url)",
  "join public.questions q on q.slug = v.slug;",
  "",
  "insert into public.related_questions (question_id, related_question_id, position)",
  "select q.id, r.id, v.position",
  "from (values",
  rows(questions.flatMap((q) => (q.related ?? []).map((related, i) => [sq(q.slug), sq(related), i + 1]))),
  ") as v (slug, related, position)",
  "join public.questions q on q.slug = v.slug",
  "join public.questions r on r.slug = v.related;",
  "",
];

process.stdout.write(out.join("\n"));
