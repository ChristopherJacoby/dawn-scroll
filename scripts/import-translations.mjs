#!/usr/bin/env node
// Builds (and optionally loads) the ASV, YLT and WEB texts from eBible.org's
// verse-per-line archives, checked verse by verse against our KJV:
//
//   node scripts/import-translations.mjs          # download + validate + report
//   node scripts/import-translations.mjs --load   # …then load into $SUPABASE_DB_URL (psql)
//
// Loading never changes is_enabled: a new translation stays hidden (RLS)
// until a migration enables it. Sources: data/translations/source-manifest.json.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { compareVerseKeys, findMarkup, parseVpl, restoreChapterOpenings, verseKey } from "../src/lib/bible/vpl.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const DIR = `${ROOT}data/translations`;
const RAW = `${DIR}/raw`;
const OUT = `${DIR}/out`;
const MANIFEST_PATH = `${DIR}/source-manifest.json`;
const REPORT_PATH = `${DIR}/validation-report.json`;
const KJV_PATH = `${ROOT}data/kjv/kjv.normalized.json`;
const CSV_PATH = `${OUT}/verses.csv`;

// eBible's VPL book codes (BibleWorks-style, not USFM) to our book slugs.
const BOOK_BY_CODE = new Map([
  ["GEN", "genesis"], ["EXO", "exodus"], ["LEV", "leviticus"], ["NUM", "numbers"], ["DEU", "deuteronomy"],
  ["JOS", "joshua"], ["JDG", "judges"], ["RUT", "ruth"], ["1SA", "1-samuel"], ["2SA", "2-samuel"],
  ["1KI", "1-kings"], ["2KI", "2-kings"], ["1CH", "1-chronicles"], ["2CH", "2-chronicles"], ["EZR", "ezra"],
  ["NEH", "nehemiah"], ["EST", "esther"], ["JOB", "job"], ["PSA", "psalms"], ["PRO", "proverbs"],
  ["ECC", "ecclesiastes"], ["SOL", "song-of-solomon"], ["ISA", "isaiah"], ["JER", "jeremiah"], ["LAM", "lamentations"],
  ["EZE", "ezekiel"], ["DAN", "daniel"], ["HOS", "hosea"], ["JOE", "joel"], ["AMO", "amos"],
  ["OBA", "obadiah"], ["JON", "jonah"], ["MIC", "micah"], ["NAH", "nahum"], ["HAB", "habakkuk"],
  ["ZEP", "zephaniah"], ["HAG", "haggai"], ["ZEC", "zechariah"], ["MAL", "malachi"], ["MAT", "matthew"],
  ["MAR", "mark"], ["LUK", "luke"], ["JOH", "john"], ["ACT", "acts"], ["ROM", "romans"],
  ["1CO", "1-corinthians"], ["2CO", "2-corinthians"], ["GAL", "galatians"], ["EPH", "ephesians"], ["PHI", "philippians"],
  ["COL", "colossians"], ["1TH", "1-thessalonians"], ["2TH", "2-thessalonians"], ["1TI", "1-timothy"], ["2TI", "2-timothy"],
  ["TIT", "titus"], ["PHM", "philemon"], ["HEB", "hebrews"], ["JAM", "james"], ["1PE", "1-peter"],
  ["2PE", "2-peter"], ["1JO", "1-john"], ["2JO", "2-john"], ["3JO", "3-john"], ["JUD", "jude"], ["REV", "revelation"],
]);

// Where each edition's verse map legitimately differs from the KJV's; any
// other difference fails validation.
const DIFFERENCES = {
  asv: {
    // Verses the ASV's critical text omits (blank lines in the source).
    missing: [
      "matthew.17.21", "matthew.18.11", "matthew.23.14", "mark.7.16", "mark.9.44", "mark.9.46", "mark.11.26",
      "mark.15.28", "luke.17.36", "luke.23.17", "john.5.4", "acts.8.37", "acts.15.34", "acts.24.7",
      "acts.28.29", "romans.16.24",
    ],
    extra: [],
  },
  ylt: { missing: [], extra: [] },
  web: {
    missing: [
      // Absent from the Majority Text the WEB follows.
      "luke.17.36", "acts.8.37", "acts.15.34", "acts.24.7",
      // The closing doxology, which the WEB places at Romans 14:24–26.
      "romans.16.25", "romans.16.26", "romans.16.27",
    ],
    extra: ["romans.14.24", "romans.14.25", "romans.14.26"],
  },
  // The Reina-Valera divides these passages as Spanish Bibles do. eBible
  // slots its text into KJV verse numbers, leaving these numbers empty: the
  // text sits in the verse before (2 Samuel 20:25, Acts 19:40) or the chapter
  // runs on Spanish numbering (Jonah 2:1 is the great fish, KJV 1:17).
  rv1909: {
    missing: [
      "numbers.12.16", "numbers.29.40", "1-samuel.23.29", "2-samuel.20.26", "2-chronicles.33.25",
      "job.35.16", "job.38.39", "job.38.40", "job.38.41", "job.40.20", "job.40.21", "job.40.22",
      "job.40.23", "job.40.24", "hosea.11.12", "jonah.1.17", "acts.19.41", "2-corinthians.13.14",
    ],
    extra: [],
  },
};

// Opening words of well-known verses, to catch book-code or offset mistakes.
const SPOT_CHECKS = {
  asv: [
    ["genesis.1.1", "In the beginning God created the heavens and the earth."],
    ["psalms.23.1", "A Psalm of David. Jehovah is my shepherd;"],
    ["john.3.16", "For God so loved the world, that he gave his only begotten Son,"],
    ["revelation.22.21", "The grace of the Lord Jesus be with the saints. Amen."],
  ],
  ylt: [
    ["genesis.1.1", "In the beginning of God's preparing the heavens and the earth"],
    ["psalms.23.1", "A Psalm of David. Jehovah [is] my shepherd,"],
    ["john.3.16", "for God did so love the world,"],
    ["revelation.22.21", "The grace of our Lord Jesus Christ [is] with you all. Amen."],
  ],
  web: [
    ["genesis.1.1", "In the beginning, God created the heavens and the earth."],
    ["psalms.23.1", "A Psalm by David. The LORD is my shepherd;"],
    ["john.3.16", "For God so loved the world, that he gave his only born Son,"],
    ["romans.14.24", "Now to him who is able to establish you"],
    ["revelation.22.21", "The grace of the Lord Jesus Christ be with all the saints. Amen."],
  ],
  rv1909: [
    ["genesis.1.1", "En el principio crió Dios los cielos y la tierra."],
    ["psalms.23.1", "Salmo de David. Jehová es mi pastor; nada me faltará."],
    ["jonah.2.1", "Mas Jehová había prevenido un gran pez que tragase á Jonás:"],
    ["john.3.16", "Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito,"],
    ["revelation.22.21", "La gracia de nuestro Señor Jesucristo sea con todos vosotros. Amén."],
  ],
};

// ── Download ──────────────────────────────────────────────────────────────

async function downloadSources() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  mkdirSync(RAW, { recursive: true });
  let changed = false;
  for (const { source } of manifest.translations) {
    const path = `${RAW}/${source.file}`;
    if (!existsSync(path)) {
      process.stderr.write(`Downloading ${source.title}…\n`);
      const response = await fetch(source.url);
      if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`);
      writeFileSync(path, Buffer.from(await response.arrayBuffer()));
    }
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (source.sha256 && source.sha256 !== sha256) {
      throw new Error(`${source.file}: checksum changed (expected ${source.sha256}, got ${sha256}). Review the new upstream text, then update the manifest.`);
    }
    if (!source.sha256) {
      source.sha256 = sha256;
      changed = true;
    }
  }
  if (changed) writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

// Extracted fresh every run, so the text parsed is always the zip whose
// checksum was just verified.
function readText(source) {
  const dest = `${RAW}/${source.key}`;
  mkdirSync(dest, { recursive: true });
  execFileSync("unzip", ["-q", "-o", `${RAW}/${source.file}`, source.textFile, "-d", dest]);
  return readFileSync(`${dest}/${source.textFile}`, "utf8");
}

// ── Validate ─────────────────────────────────────────────────────────────

function kjvVerseKeys() {
  const kjv = JSON.parse(readFileSync(KJV_PATH, "utf8"));
  const slugByOsis = new Map(kjv.books.map((book) => [book.osisId, book.slug]));
  return new Set(kjv.verses.map((v) => verseKey(slugByOsis.get(v.book), v.chapter, v.verse)));
}

const sorted = (keys) => [...keys].sort();
const sameKeys = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

function validate(slug, parsed, kjvKeys) {
  const errors = [...parsed.errors];
  const byKey = new Map(parsed.verses.map((v) => [verseKey(v.book, v.chapter, v.verse), v]));

  const markup = findMarkup(parsed.verses);
  if (markup.length) errors.push(`Leftover markup in ${markup.length} verses: ${markup.slice(0, 10).join(", ")}`);

  const expected = DIFFERENCES[slug];
  const actual = compareVerseKeys(kjvKeys, new Set(byKey.keys()));
  if (!sameKeys(actual.missing, expected.missing)) {
    errors.push(`Verses missing vs KJV differ from the documented list: ${sorted(actual.missing).join(", ") || "none"}`);
  }
  if (!sameKeys(actual.extra, expected.extra)) {
    errors.push(`Verses extra vs KJV differ from the documented list: ${sorted(actual.extra).join(", ") || "none"}`);
  }
  // A blank line is how the source marks an omitted verse, so every blank
  // must be one of the documented omissions.
  const undocumentedBlank = parsed.blank.filter((key) => !expected.missing.includes(key));
  if (undocumentedBlank.length) errors.push(`Blank verses not in the documented omissions: ${undocumentedBlank.join(", ")}`);

  for (const [key, start] of SPOT_CHECKS[slug]) {
    const verse = byKey.get(key);
    if (!verse) errors.push(`Missing spot-check verse ${key}`);
    else if (!verse.text.startsWith(start)) errors.push(`Spot-check mismatch at ${key}`);
  }

  const chapters = new Set(parsed.verses.map((v) => `${v.book}.${v.chapter}`));
  return {
    ok: errors.length === 0,
    errors,
    totals: {
      books: new Set(parsed.verses.map((v) => v.book)).size,
      chapters: chapters.size,
      verses: parsed.verses.length,
    },
    differencesFromKjv: { missing: sorted(actual.missing), extra: sorted(actual.extra) },
  };
}

// ── Build ────────────────────────────────────────────────────────────────

const csvField = (value) => `"${String(value).replaceAll('"', '""')}"`;

function build(manifest) {
  const kjvKeys = kjvVerseKeys();
  const report = { generatedAt: new Date().toISOString(), comparedWith: "data/kjv/kjv.normalized.json", translations: {} };
  const rows = ["translation_slug,book_slug,chapter,verse,verse_text"];
  for (const { slug, source } of manifest.translations) {
    const parsed = parseVpl(readText(source), BOOK_BY_CODE);
    if (source.capitalizedChapterOpenings) parsed.verses = restoreChapterOpenings(parsed.verses);
    const result = validate(slug, parsed, kjvKeys);
    report.translations[slug] = { source: { key: source.key, url: source.url, sha256: source.sha256 }, ...result };
    for (const v of parsed.verses) {
      rows.push([slug, v.book, v.chapter, v.verse, v.text].map(csvField).join(","));
    }
  }
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  const failed = Object.entries(report.translations).filter(([, t]) => !t.ok);
  if (failed.length) {
    for (const [slug, t] of failed) for (const error of t.errors) process.stderr.write(`${slug}: ${error}\n`);
    throw new Error(`Validation failed for ${failed.map(([slug]) => slug).join(", ")}; see ${REPORT_PATH}.`);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(CSV_PATH, `${rows.join("\n")}\n`);
  return report;
}

// ── Load ─────────────────────────────────────────────────────────────────

const sql = (value) => (value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`);

function load(manifest) {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("Set SUPABASE_DB_URL to load.");
  const items = manifest.translations;
  const slugs = items.map((t) => sql(t.slug)).join(", ");
  const translationValues = items
    .map((t) => `(${[t.slug, t.abbreviation, t.name, t.languageCode, "kjv", t.copyrightNotice, t.source.license].map(sql).join(", ")}, true, false, ${sql(JSON.stringify({ sourceManifest: "data/translations/source-manifest.json" }))}::jsonb)`)
    .join(",\n  ");
  const sourceValues = items
    .map((t) => `(${[t.slug, t.source.key, t.source.title, t.source.url, t.source.license, t.source.attribution, t.source.sha256, t.source.catalogUrl].map(sql).join(", ")})`)
    .join(",\n  ");
  const script = `
\\set ON_ERROR_STOP on
begin;
-- Copying ~13MB over the network outlasts Supabase's default timeout.
set local statement_timeout = 0;
insert into public.translations (slug, abbreviation, name, language_code, versification, copyright_notice, rights_statement, is_public_domain, is_enabled, metadata)
values
  ${translationValues}
on conflict (slug) do update set abbreviation = excluded.abbreviation, name = excluded.name, language_code = excluded.language_code,
  versification = excluded.versification, copyright_notice = excluded.copyright_notice, rights_statement = excluded.rights_statement,
  is_public_domain = excluded.is_public_domain, metadata = excluded.metadata;
create temp table stage_sources (translation_slug text, source_key text, title text, url text, license text, attribution text, sha256 text, catalog_url text);
insert into stage_sources values
  ${sourceValues};
insert into public.data_sources (translation_id, source_key, source_type, title, url, license, attribution, checksum_sha256, imported_at, metadata)
select t.id, s.source_key, 'digital_text', s.title, s.url, s.license, s.attribution, s.sha256, now(), jsonb_build_object('catalogUrl', s.catalog_url)
from stage_sources s join public.translations t on t.slug = s.translation_slug
on conflict (source_key) do update set translation_id = excluded.translation_id, source_type = excluded.source_type, title = excluded.title,
  url = excluded.url, license = excluded.license, attribution = excluded.attribution, checksum_sha256 = excluded.checksum_sha256,
  imported_at = excluded.imported_at, metadata = excluded.metadata;
create temp table stage_verses (translation_slug text, book_slug text, chapter smallint, verse smallint, verse_text text);
\\copy stage_verses from '${CSV_PATH}' with (format csv, header true)
insert into public.verses (translation_id, book_id, chapter_number, verse_number, verse_text, source_id)
select t.id, b.id, v.chapter, v.verse, v.verse_text, ds.id
from stage_verses v
join public.translations t on t.slug = v.translation_slug
join public.books b on b.slug = v.book_slug
join stage_sources s on s.translation_slug = v.translation_slug
join public.data_sources ds on ds.source_key = s.source_key
on conflict (translation_id, book_id, chapter_number, verse_number) do update
  set verse_text = excluded.verse_text, source_id = excluded.source_id
  where public.verses.verse_text is distinct from excluded.verse_text
     or public.verses.source_id is distinct from excluded.source_id;
-- Inner joins drop rows silently, and verses removed upstream would linger
-- (annotations may reference them, so they're never deleted here); refuse
-- to commit unless each translation holds exactly the staged text.
do $$
declare
  unloaded text;
  leftover text;
begin
  select string_agg(format('%s %s %s:%s', s.translation_slug, s.book_slug, s.chapter, s.verse), ', ') into unloaded
  from (
    select s.* from stage_verses s
    where not exists (
      select 1 from public.verses v
      join public.translations t on t.id = v.translation_id
      join public.books b on b.id = v.book_id
      where t.slug = s.translation_slug and b.slug = s.book_slug
        and v.chapter_number = s.chapter and v.verse_number = s.verse
    )
    limit 10
  ) s;
  if unloaded is not null then
    raise exception 'Staged verses that did not load: %; rolling back.', unloaded;
  end if;
  select string_agg(format('%s %s %s:%s', x.slug, x.book, x.chapter_number, x.verse_number), ', ') into leftover
  from (
    select t.slug, b.slug as book, v.chapter_number, v.verse_number
    from public.verses v
    join public.translations t on t.id = v.translation_id
    join public.books b on b.id = v.book_id
    where t.slug in (${slugs})
      and not exists (
        select 1 from stage_verses s
        where s.translation_slug = t.slug and s.book_slug = b.slug
          and s.chapter = v.chapter_number and s.verse = v.verse_number
      )
    limit 10
  ) x;
  if leftover is not null then
    raise exception 'Verses no longer in the source: %; review and remove them (and any annotations) by hand. Rolling back.', leftover;
  end if;
end $$;
select t.slug, t.is_enabled, count(v.id) as verses
from public.translations t left join public.verses v on v.translation_id = t.id
where t.slug in (${slugs}) group by t.slug, t.is_enabled order by t.slug;
commit;
`;
  // Connection details go through PG* env vars, never argv, so a failure
  // can't echo the password in an error message.
  let db;
  try {
    db = new URL(url);
  } catch {
    // Node's URL error includes the input, i.e. the password.
    throw new Error("SUPABASE_DB_URL is not a valid URL (percent-encode special characters in the password).");
  }
  const env = {
    ...process.env,
    PGHOST: db.hostname,
    PGPORT: db.port || "5432",
    PGUSER: decodeURIComponent(db.username),
    PGPASSWORD: decodeURIComponent(db.password),
    PGDATABASE: db.pathname.slice(1) || "postgres",
    // Keep the URL's TLS settings; default to requiring TLS.
    PGSSLMODE: db.searchParams.get("sslmode") ?? "require",
    ...(db.searchParams.get("sslrootcert") && { PGSSLROOTCERT: db.searchParams.get("sslrootcert") }),
  };
  try {
    execFileSync("psql", ["-q", "-f", "-"], { input: script, env, stdio: ["pipe", "inherit", "inherit"] });
  } catch {
    throw new Error("Load failed (see psql output above); nothing was changed.");
  }
}

const manifest = await downloadSources();
const report = build(manifest);
for (const [slug, t] of Object.entries(report.translations)) {
  process.stderr.write(`${slug}: ${t.totals.verses} verses in ${t.totals.chapters} chapters of ${t.totals.books} books\n`);
}
if (process.argv.includes("--load")) load(manifest);
