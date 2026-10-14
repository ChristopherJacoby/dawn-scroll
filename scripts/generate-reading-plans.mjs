#!/usr/bin/env node
// Generates the default reading plans from the normalized KJV data (verse
// counts per chapter), so daily readings are balanced by length rather than
// chapter count. Output is idempotent SQL:
//
//   node scripts/generate-reading-plans.mjs > data/reading-plans/reading-plans.seed.sql
//
// Production was seeded by migration 20261014030100 (a snapshot of this
// output). Local `supabase db reset` runs migrations before seeds, when
// books don't exist yet, so that migration inserts no readings there; this
// seed file (listed after kjv.seed.sql in supabase/config.toml) fills them.

import { readFileSync } from "node:fs";

const kjv = JSON.parse(
  readFileSync(new URL("../data/kjv/kjv.normalized.json", import.meta.url), "utf8"),
);

// osisId → slug, in canonical order (matches scripts/import-kjv.mjs).
const BOOK_SLUGS = new Map([
  ["Gen", "genesis"], ["Exod", "exodus"], ["Lev", "leviticus"], ["Num", "numbers"], ["Deut", "deuteronomy"],
  ["Josh", "joshua"], ["Judg", "judges"], ["Ruth", "ruth"], ["1Sam", "1-samuel"], ["2Sam", "2-samuel"],
  ["1Kgs", "1-kings"], ["2Kgs", "2-kings"], ["1Chr", "1-chronicles"], ["2Chr", "2-chronicles"], ["Ezra", "ezra"],
  ["Neh", "nehemiah"], ["Esth", "esther"], ["Job", "job"], ["Ps", "psalms"], ["Prov", "proverbs"],
  ["Eccl", "ecclesiastes"], ["Song", "song-of-solomon"], ["Isa", "isaiah"], ["Jer", "jeremiah"], ["Lam", "lamentations"],
  ["Ezek", "ezekiel"], ["Dan", "daniel"], ["Hos", "hosea"], ["Joel", "joel"], ["Amos", "amos"],
  ["Obad", "obadiah"], ["Jonah", "jonah"], ["Mic", "micah"], ["Nah", "nahum"], ["Hab", "habakkuk"],
  ["Zeph", "zephaniah"], ["Hag", "haggai"], ["Zech", "zechariah"], ["Mal", "malachi"], ["Matt", "matthew"],
  ["Mark", "mark"], ["Luke", "luke"], ["John", "john"], ["Acts", "acts"], ["Rom", "romans"],
  ["1Cor", "1-corinthians"], ["2Cor", "2-corinthians"], ["Gal", "galatians"], ["Eph", "ephesians"], ["Phil", "philippians"],
  ["Col", "colossians"], ["1Thess", "1-thessalonians"], ["2Thess", "2-thessalonians"], ["1Tim", "1-timothy"], ["2Tim", "2-timothy"],
  ["Titus", "titus"], ["Phlm", "philemon"], ["Heb", "hebrews"], ["Jas", "james"], ["1Pet", "1-peter"],
  ["2Pet", "2-peter"], ["1John", "1-john"], ["2John", "2-john"], ["3John", "3-john"], ["Jude", "jude"],
  ["Rev", "revelation"],
]);

/** Every chapter in canonical order with its verse count. */
const chapters = [];
for (const v of kjv.verses) {
  const last = chapters.at(-1);
  if (last && last.book === v.book && last.chapter === v.chapter) last.verses += 1;
  else chapters.push({ book: v.book, chapter: v.chapter, verses: 1 });
}

const inBooks = (...books) => chapters.filter((c) => books.includes(c.book));

/**
 * Split chapters (in order) into `days` contiguous runs of roughly equal
 * verse count: each day aims for the remaining verses / remaining days,
 * always leaving at least one chapter for every later day.
 */
function splitBalanced(list, days) {
  const result = [];
  let i = 0;
  for (let d = 0; d < days; d++) {
    const daysLeft = days - d;
    const versesLeft = list.slice(i).reduce((n, c) => n + c.verses, 0);
    const target = versesLeft / daysLeft;
    const day = [list[i++]];
    let total = day[0].verses;
    while (i < list.length && list.length - i > daysLeft - 1) {
      const next = total + list[i].verses;
      if (Math.abs(next - target) > Math.abs(total - target)) break;
      day.push(list[i++]);
      total = next;
    }
    result.push(day);
  }
  if (i !== list.length) throw new Error("chapters left over");
  return result;
}

/** Merge consecutive chapters of one book into { book, start, end } ranges. */
function toReadings(dayChapters) {
  const readings = [];
  for (const c of dayChapters) {
    const last = readings.at(-1);
    if (last && last.book === c.book && last.end === c.chapter - 1) last.end = c.chapter;
    else readings.push({ book: c.book, start: c.chapter, end: c.chapter });
  }
  return readings;
}

const psalmsAndProverbs = Array.from({ length: 31 }, (_, i) => {
  const n = i + 1;
  const psalms = n <= 30 ? [n, n + 30, n + 60, n + 90, n + 120].map((p) => ({ book: "Ps", start: p, end: p })) : [];
  return [...psalms, { book: "Prov", start: n, end: n }];
});

const PLANS = [
  {
    slug: "bible-in-a-year",
    name: "Bible in a Year",
    description: "Read the whole Bible, Genesis to Revelation, in 365 days of about 85 verses each.",
    days: splitBalanced(chapters, 365).map(toReadings),
  },
  {
    slug: "gospels-in-30-days",
    name: "Gospels in 30 Days",
    description: "Walk through the life of Jesus in Matthew, Mark, Luke and John in a month.",
    days: splitBalanced(inBooks("Matt", "Mark", "Luke", "John"), 30).map(toReadings),
  },
  {
    slug: "psalms-and-proverbs",
    name: "Psalms and Proverbs",
    description: "Five psalms and a chapter of Proverbs a day: all 150 psalms and all 31 proverbs in a month.",
    days: psalmsAndProverbs,
  },
];

const q = (s) => `'${s.replaceAll("'", "''")}'`;
const out = [
  "-- Generated by scripts/generate-reading-plans.mjs from data/kjv; do not edit by hand.",
  "-- Idempotent: safe to run after the seed migration.",
];
for (const plan of PLANS) {
  out.push(
    "",
    `-- ${plan.name}: ${plan.days.length} days`,
    `insert into public.reading_plans (slug, name, description, duration_days) values (${q(plan.slug)}, ${q(plan.name)}, ${q(plan.description)}, ${plan.days.length}) on conflict (slug) do nothing;`,
    `insert into public.reading_plan_days (plan_id, day_number) select p.id, d from public.reading_plans p, generate_series(1, ${plan.days.length}) d where p.slug = ${q(plan.slug)} on conflict do nothing;`,
  );
  const values = plan.days.flatMap((readings, d) =>
    readings.map((r, position) => `(${d + 1}, ${position + 1}, ${q(BOOK_SLUGS.get(r.book))}, ${r.start}, ${r.end})`),
  );
  out.push(
    "insert into public.reading_plan_readings (plan_id, day_number, position, book_id, start_chapter, end_chapter)",
    "select p.id, v.day_number, v.position, b.id, v.start_chapter, v.end_chapter",
    "from (values",
    values.map((v) => `  ${v}`).join(",\n"),
    `) as v (day_number, position, book_slug, start_chapter, end_chapter)`,
    `join public.reading_plans p on p.slug = ${q(plan.slug)}`,
    "join public.books b on b.slug = v.book_slug",
    "on conflict do nothing;",
  );
}
out.push("");
process.stdout.write(out.join("\n"));

// Sanity report on stderr: daily verse counts per balanced plan.
for (const plan of PLANS.slice(0, 2)) {
  const counts = plan.days.map((rs) =>
    rs.reduce((n, r) => n + chapters.filter((c) => c.book === r.book && c.chapter >= r.start && c.chapter <= r.end).reduce((m, c) => m + c.verses, 0), 0),
  );
  process.stderr.write(`${plan.slug}: ${plan.days.length} days, verses/day min ${Math.min(...counts)} max ${Math.max(...counts)} avg ${Math.round(counts.reduce((a, b) => a + b) / counts.length)}\n`);
}
