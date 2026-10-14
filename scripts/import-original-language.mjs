#!/usr/bin/env node
// Builds (and optionally loads) the original-language layer:
//   - Strong's Greek + Hebrew dictionaries      → strongs_entries
//   - STEPBible morphology code expansions       → morphology_codes
//   - STEPBible TAHOT/TAGNT words per verse      → verse_original_words
//   - eBible KJV2006 Strong's tags, aligned to our KJV text and linked to
//     those original words                       → verse_word_map
//
//   node scripts/import-original-language.mjs          # download + build + report
//   node scripts/import-original-language.mjs --load   # …then load into $SUPABASE_DB_URL (psql)
//
// Sources and licenses: data/original-language/source-manifest.json.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { alignTokens } from "../src/lib/language/align.ts";
import { parseMorphologyExpansion } from "../src/lib/language/morphology.ts";
import { normalizeStrongs, tokenizeVerse } from "../src/lib/language/text.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const DIR = `${ROOT}data/original-language`;
const RAW = `${DIR}/raw`;
const OUT = `${DIR}/out`;
const MANIFEST_PATH = `${DIR}/source-manifest.json`;

// Canonical book order: [our OSIS id, slug, USFM code, STEPBible abbreviation].
const BOOKS = [
  ["Gen", "genesis", "GEN", "Gen"], ["Exod", "exodus", "EXO", "Exo"], ["Lev", "leviticus", "LEV", "Lev"],
  ["Num", "numbers", "NUM", "Num"], ["Deut", "deuteronomy", "DEU", "Deu"], ["Josh", "joshua", "JOS", "Jos"],
  ["Judg", "judges", "JDG", "Jdg"], ["Ruth", "ruth", "RUT", "Rut"], ["1Sam", "1-samuel", "1SA", "1Sa"],
  ["2Sam", "2-samuel", "2SA", "2Sa"], ["1Kgs", "1-kings", "1KI", "1Ki"], ["2Kgs", "2-kings", "2KI", "2Ki"],
  ["1Chr", "1-chronicles", "1CH", "1Ch"], ["2Chr", "2-chronicles", "2CH", "2Ch"], ["Ezra", "ezra", "EZR", "Ezr"],
  ["Neh", "nehemiah", "NEH", "Neh"], ["Esth", "esther", "EST", "Est"], ["Job", "job", "JOB", "Job"],
  ["Ps", "psalms", "PSA", "Psa"], ["Prov", "proverbs", "PRO", "Pro"], ["Eccl", "ecclesiastes", "ECC", "Ecc"],
  ["Song", "song-of-solomon", "SNG", "Sng"], ["Isa", "isaiah", "ISA", "Isa"], ["Jer", "jeremiah", "JER", "Jer"],
  ["Lam", "lamentations", "LAM", "Lam"], ["Ezek", "ezekiel", "EZK", "Ezk"], ["Dan", "daniel", "DAN", "Dan"],
  ["Hos", "hosea", "HOS", "Hos"], ["Joel", "joel", "JOL", "Jol"], ["Amos", "amos", "AMO", "Amo"],
  ["Obad", "obadiah", "OBA", "Oba"], ["Jonah", "jonah", "JON", "Jon"], ["Mic", "micah", "MIC", "Mic"],
  ["Nah", "nahum", "NAM", "Nam"], ["Hab", "habakkuk", "HAB", "Hab"], ["Zeph", "zephaniah", "ZEP", "Zep"],
  ["Hag", "haggai", "HAG", "Hag"], ["Zech", "zechariah", "ZEC", "Zec"], ["Mal", "malachi", "MAL", "Mal"],
  ["Matt", "matthew", "MAT", "Mat"], ["Mark", "mark", "MRK", "Mrk"], ["Luke", "luke", "LUK", "Luk"],
  ["John", "john", "JHN", "Jhn"], ["Acts", "acts", "ACT", "Act"], ["Rom", "romans", "ROM", "Rom"],
  ["1Cor", "1-corinthians", "1CO", "1Co"], ["2Cor", "2-corinthians", "2CO", "2Co"], ["Gal", "galatians", "GAL", "Gal"],
  ["Eph", "ephesians", "EPH", "Eph"], ["Phil", "philippians", "PHP", "Php"], ["Col", "colossians", "COL", "Col"],
  ["1Thess", "1-thessalonians", "1TH", "1Th"], ["2Thess", "2-thessalonians", "2TH", "2Th"], ["1Tim", "1-timothy", "1TI", "1Ti"],
  ["2Tim", "2-timothy", "2TI", "2Ti"], ["Titus", "titus", "TIT", "Tit"], ["Phlm", "philemon", "PHM", "Phm"],
  ["Heb", "hebrews", "HEB", "Heb"], ["Jas", "james", "JAS", "Jas"], ["1Pet", "1-peter", "1PE", "1Pe"],
  ["2Pet", "2-peter", "2PE", "2Pe"], ["1John", "1-john", "1JN", "1Jn"], ["2John", "2-john", "2JN", "2Jn"],
  ["3John", "3-john", "3JN", "3Jn"], ["Jude", "jude", "JUD", "Jud"], ["Rev", "revelation", "REV", "Rev"],
];
const SLUG_BY_OSIS = new Map(BOOKS.map(([osis, slug]) => [osis, slug]));
const SLUG_BY_USFM = new Map(BOOKS.map(([, slug, usfm]) => [usfm, slug]));
const SLUG_BY_STEP = new Map(BOOKS.map(([, slug, , step]) => [step, slug]));
const verseKey = (slug, chapter, verse) => `${slug}.${chapter}.${verse}`;

// ── Download ──────────────────────────────────────────────────────────────

async function downloadSources() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  mkdirSync(RAW, { recursive: true });
  let changed = false;
  for (const source of manifest.sources) {
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
      changed = true;
    }
  }
  if (changed) writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function unzip(zipFile, into) {
  const dest = `${RAW}/${into}`;
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
    execFileSync("unzip", ["-q", "-o", `${RAW}/${zipFile}`, "-d", dest]);
  }
  return dest;
}

// ── Strong's dictionaries ────────────────────────────────────────────────

const decodeXml = (s) =>
  s.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&amp;", "&");
const collapse = (s) => decodeXml(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;

function parseGreekStrongs() {
  const dir = unzip("StrongsGreekDictionaryXML_1.4.zip", "strongs-greek");
  const xml = readFileSync(`${dir}/strongsgreek.xml`, "utf8");
  const entries = [];
  for (const [, num, body] of xml.matchAll(/<entry strongs="(\d+)">([\s\S]*?)<\/entry>/g)) {
    const greek = body.match(/<greek [^>]*\/>/)?.[0] ?? "";
    const refs = (s) =>
      s.replace(/<strongsref language="(GREEK|HEBREW)" strongs="(\d+)"\s*\/>/g, (_, lang, n) => `${lang === "GREEK" ? "G" : "H"}${Number(n)}`);
    const def = collapse(refs(body.match(/<strongs_def>([\s\S]*?)<\/strongs_def>/)?.[1] ?? ""));
    const kjv = collapse(body.match(/<kjv_def>([\s\S]*?)<\/kjv_def>/)?.[1] ?? "").replace(/^:--/, "").replace(/\.$/, "");
    entries.push({
      number: normalizeStrongs(`G${num}`),
      language: "greek",
      lemma: attr(greek, "unicode") ?? "",
      transliteration: attr(greek, "translit") ?? "",
      pronunciation: attr(body.match(/<pronunciation [^>]*\/>/)?.[0] ?? "", "strongs"),
      derivation: collapse(refs(body.match(/<strongs_derivation>([\s\S]*?)<\/strongs_derivation>/)?.[1] ?? "")) || null,
      definition: def || kjv,
      kjv_usage: kjv || null,
    });
  }
  return entries;
}

function parseHebrewStrongs() {
  const xml = readFileSync(`${RAW}/HebrewStrong.xml`, "utf8");
  const entries = new Map();
  for (const [, id, body] of xml.matchAll(/<entry id="(H\d+[a-z]?)">([\s\S]*?)<\/entry>/g)) {
    const number = normalizeStrongs(id);
    if (!number || entries.has(number)) continue; // keep the base entry over lettered variants
    const w = body.match(/<w [^>]*>([^<]*)<\/w>/);
    const refs = (s) => s.replace(/<w src="(H\d+)[a-z]?"[^>]*>[^<]*<\/w>/g, (_, src) => src);
    const meaning = collapse(body.match(/<meaning>([\s\S]*?)<\/meaning>/)?.[1] ?? "");
    const usage = collapse(body.match(/<usage>([\s\S]*?)<\/usage>/)?.[1] ?? "").replace(/\.$/, "");
    entries.set(number, {
      number,
      language: "hebrew",
      lemma: w?.[1] ?? "",
      transliteration: attr(w?.[0] ?? "", "xlit") ?? "",
      pronunciation: attr(w?.[0] ?? "", "pron"),
      derivation: collapse(refs(body.match(/<source>([\s\S]*?)<\/source>/)?.[1] ?? "")) || null,
      definition: meaning || usage,
      kjv_usage: usage || null,
    });
  }
  return [...entries.values()];
}

// ── Morphology codes ─────────────────────────────────────────────────────

function parseMorphologyCodes(file, language) {
  const codes = new Map();
  for (const line of readFileSync(`${RAW}/${file}`, "utf8").split(/\r?\n/)) {
    const [code, expansion] = line.split("\t");
    if (!code || !expansion?.includes("Function=") || /\s/.test(code)) continue;
    if (!codes.has(code)) codes.set(code, { code, language, features: parseMorphologyExpansion(expansion) });
  }
  return [...codes.values()];
}

// ── Original words per verse (STEPBible) ─────────────────────────────────

// "Book.c.v" then optional alternate numberings: (Hebrew), [KJV/English]
// when it differs from the edition's, {other}; then "#word=type".
const STEP_REF = /^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)((?:[([{][^)\]}]*[)\]}])*)#(\d+)=/;

/** KJV chapter/verse of a STEPBible row (the [bracketed] ref when given). */
function kjvRef(ref) {
  const english = ref[4].match(/\[(\d+)\.(\d+)\]/);
  return english ? [Number(english[1]), Number(english[2])] : [Number(ref[2]), Number(ref[3])];
}
const strongsIn = (s) => [...(s ?? "").matchAll(/[GH]\d{1,4}[A-Za-z]?/g)].map((m) => normalizeStrongs(m[0])).filter(Boolean);

/** `order` sorts words within a verse (edition chapter, verse, word #). */
function addWord(byVerse, slug, [chapter, verse], order, word) {
  const key = verseKey(slug, chapter, verse);
  if (!byVerse.has(key)) byVerse.set(key, new Map());
  const words = byVerse.get(key);
  if (!words.has(order)) words.set(order, word); // first variant (K/Q) wins
}
const wordOrder = (ref) => Number(ref[2]) * 1e6 + Number(ref[3]) * 1e3 + Number(ref[5]);

function parseTagnt(file, byVerse) {
  for (const line of readFileSync(`${RAW}/${file}`, "utf8").split(/\r?\n/)) {
    const ref = STEP_REF.exec(line);
    if (!ref) continue;
    const cols = line.split("\t");
    // KJV translates the Textus Receptus; skip words absent from it.
    // Editions look like "NA28+…+TR+Byz«14.24" (« notes a placement).
    const editions = (cols[5] ?? "").split("+").map((e) => e.split("«")[0].trim());
    if (!editions.includes("TR")) continue;
    const slug = SLUG_BY_STEP.get(ref[1]);
    if (!slug) throw new Error(`Unknown book ${ref[1]}`);
    const [form, translit] = [cols[1].replace(/\s*\(.*$/, ""), cols[1].match(/\(([^)]*)\)/)?.[1] ?? ""];
    const [strongs, morph] = cols[3].split("=");
    const s = normalizeStrongs(strongs);
    if (!s) continue;
    addWord(byVerse, slug, kjvRef(ref), wordOrder(ref), {
      w: form.replace(/[,.;:·⸀⸂⸃]+$/u, ""),
      x: translit,
      s,
      // Crasis forms carry "CONJ + G5101"; the code is the part before " + ".
      m: morph?.split(" + ")[0].trim() || null,
      g: cols[2].replace(/[,.;:]+$/, "").trim(),
      alt: strongsIn(cols[12]),
    });
  }
}

function parseTahot(file, byVerse) {
  for (const line of readFileSync(`${RAW}/${file}`, "utf8").split(/\r?\n/)) {
    const ref = STEP_REF.exec(line);
    if (!ref || ref[3] === "0") continue; // verse 0 = psalm titles, not verses in the KJV
    const cols = line.split("\t");
    const slug = SLUG_BY_STEP.get(ref[1]);
    if (!slug) throw new Error(`Unknown book ${ref[1]}`);
    // dStrongs like "H9005/{H1732}": "/" separates prefix/suffix morphemes,
    // braces mark the main word, "\" attaches punctuation.
    const segments = cols[4].split("/");
    const main = Math.max(0, segments.findIndex((seg) => seg.includes("{")));
    const s = normalizeStrongs(segments[main].match(/[GH]\d{1,4}[A-Za-z]?/)?.[0] ?? "");
    if (!s) continue;
    const grammar = cols[5] ?? "";
    const morphSegment = grammar.slice(1).split("/")[main];
    addWord(byVerse, slug, kjvRef(ref), wordOrder(ref), {
      w: cols[1].replaceAll("/", "").replaceAll("\\", ""),
      x: cols[2].replace(/[/.]/g, "").toLowerCase(),
      s,
      m: morphSegment ? `${grammar[0]}${morphSegment}` : null,
      g: cols[3].replaceAll("/", "").replace(/\s+/g, " ").trim(),
      alt: strongsIn(cols[9]),
    });
  }
}

// ── KJV Strong's tags (eBible USFM) ───────────────────────────────────────

/** Verse key → [{ text, strongs }] word tokens from the tagged edition. */
function parseTaggedKjv() {
  const dir = unzip("eng-kjv2006_usfm.zip", "kjv-strongs");
  const verses = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".usfm"))) {
    const usfm = readFileSync(`${dir}/${file}`, "utf8");
    const slug = SLUG_BY_USFM.get(usfm.match(/\\id (\w+)/)?.[1]);
    if (!slug) continue; // front matter, glossary
    let chapter = 0;
    let current = null;
    const flush = () => current && verses.set(current.key, parseUsfmVerse(current.raw));
    for (const piece of usfm.split(/(?=\\c \d+|\\v \d+)/)) {
      const c = piece.match(/^\\c (\d+)/);
      if (c) {
        flush();
        current = null;
        chapter = Number(c[1]);
        continue;
      }
      const v = piece.match(/^\\v (\d+)\s?([\s\S]*)$/);
      if (v) {
        flush();
        current = { key: verseKey(slug, chapter, Number(v[1])), raw: v[2] };
      } else if (current) {
        current.raw += piece;
      }
    }
    flush();
  }
  return verses;
}

function parseUsfmVerse(raw) {
  const text = raw
    .replace(/\\f [\s\S]*?\\f\*/g, " ")
    .replace(/\\x [\s\S]*?\\x\*/g, " ")
    // Tag each word of a \w phrase with its Strong's number: word⟦G3056⟧
    .replace(/\\\+?w ([^|\\]*?)\|strong="([^"]+)"[^\\]*\\\+?w\*/g, (_, phrase, strongs) =>
      phrase.trim().split(/\s+/).map((word) => `${word}⟦${strongs}⟧`).join(" "))
    .replace(/\\[a-z0-9]+\*?/gi, " ");
  return tokenizeVerse(text).map((token) => {
    const tag = token.match(/⟦([^⟧]+)⟧/)?.[1];
    return { text: token.replace(/⟦[^⟧]+⟧/g, ""), strongs: tag ? normalizeStrongs(tag) : null };
  });
}

// ── Build ────────────────────────────────────────────────────────────────

function csvRow(values) {
  return values
    .map((v) => (v === null || v === undefined ? "" : `"${String(v).replaceAll('"', '""')}"`))
    .join(",");
}

function build() {
  const strongs = [...parseGreekStrongs(), ...parseHebrewStrongs()];
  const known = new Set(strongs.map((e) => e.number));
  const morphology = [...parseMorphologyCodes("TEGMC.txt", "greek"), ...parseMorphologyCodes("TEHMC.txt", "hebrew")];
  const morphCodes = new Set(morphology.map((m) => m.code));

  const originalsByVerse = new Map();
  for (const file of readdirSync(RAW).filter((f) => f.startsWith("TAHOT"))) parseTahot(file, originalsByVerse);
  for (const file of readdirSync(RAW).filter((f) => f.startsWith("TAGNT"))) parseTagnt(file, originalsByVerse);
  const originals = new Map(
    [...originalsByVerse].map(([key, words]) => [key, [...words.entries()].sort((a, b) => a[0] - b[0]).map(([, w]) => w)]),
  );

  const tagged = parseTaggedKjv();
  const kjv = JSON.parse(readFileSync(`${ROOT}data/kjv/kjv.normalized.json`, "utf8"));

  const stats = { verses: 0, tokens: 0, taggedTokens: 0, linkedTokens: 0, versesWithoutTags: 0, versesWithoutOriginals: [], unknownStrongs: new Set(), unknownMorph: new Set() };
  const wordMap = [];
  for (const { book, chapter, verse, text } of kjv.verses) {
    const slug = SLUG_BY_OSIS.get(book);
    const key = verseKey(slug, chapter, verse);
    const ours = tokenizeVerse(text);
    const theirs = tagged.get(key);
    const words = originals.get(key) ?? [];
    stats.verses++;
    stats.tokens += ours.length;
    if (!theirs) stats.versesWithoutTags++;
    if (!words.length) stats.versesWithoutOriginals.push(key);
    const alignment = theirs ? alignTokens(theirs.map((t) => t.text), ours) : [];
    // Repeated Strong's numbers in a verse map to repeated original words in order.
    const nextIndex = new Map();
    const tokens = ours.map((_, i) => {
      const source = alignment[i] == null ? null : theirs[alignment[i]];
      const s = source?.strongs;
      if (!s) return null;
      stats.taggedTokens++;
      if (!known.has(s)) stats.unknownStrongs.add(s);
      const candidates = words.flatMap((w, index) => (w.s === s || w.alt.includes(s) ? [index] : []));
      const used = nextIndex.get(s) ?? 0;
      const o = candidates.length ? candidates[Math.min(used, candidates.length - 1)] : null;
      nextIndex.set(s, used + 1);
      if (o !== null) stats.linkedTokens++;
      return { s, o };
    });
    if (tokens.some(Boolean)) wordMap.push([slug, chapter, verse, JSON.stringify(tokens)]);
  }

  const originalRows = [...originals].map(([key, words]) => {
    for (const w of words) if (w.m && !morphCodes.has(w.m)) stats.unknownMorph.add(w.m);
    const [slug, chapter, verse] = key.split(".");
    // `alt` (alternate Strong's) is only for linking; don't store it.
    const stored = words.map((w) => ({ w: w.w, x: w.x, s: w.s, m: w.m, g: w.g }));
    return [slug, chapter, verse, JSON.stringify(stored)];
  });

  mkdirSync(OUT, { recursive: true });
  const write = (name, header, rows) =>
    writeFileSync(`${OUT}/${name}.csv`, [header.join(","), ...rows.map(csvRow)].join("\n") + "\n");
  write("strongs_entries", ["number", "language", "lemma", "transliteration", "pronunciation", "derivation", "definition", "kjv_usage"],
    strongs.map((e) => [e.number, e.language, e.lemma, e.transliteration, e.pronunciation, e.derivation, e.definition, e.kjv_usage]));
  write("morphology_codes", ["code", "language", "features"], morphology.map((m) => [m.code, m.language, JSON.stringify(m.features)]));
  write("verse_original_words", ["book_slug", "chapter", "verse", "words"], originalRows);
  write("verse_word_map", ["book_slug", "chapter", "verse", "tokens"], wordMap);

  const report = {
    strongsEntries: strongs.length,
    morphologyCodes: morphology.length,
    versesWithOriginals: originalRows.length,
    originalWords: originalRows.reduce((n, r) => n + JSON.parse(r[3]).length, 0),
    kjvVerses: stats.verses,
    kjvTokens: stats.tokens,
    taggedTokens: stats.taggedTokens,
    taggedPercent: +((stats.taggedTokens / stats.tokens) * 100).toFixed(1),
    linkedToOriginalPercent: +((stats.linkedTokens / stats.taggedTokens) * 100).toFixed(1),
    versesWithoutTags: stats.versesWithoutTags,
    versesWithoutOriginals: stats.versesWithoutOriginals,
    unknownStrongs: [...stats.unknownStrongs].sort().slice(0, 50),
    unknownStrongsCount: stats.unknownStrongs.size,
    unknownMorphologyCount: stats.unknownMorph.size,
    unknownMorphologySample: [...stats.unknownMorph].slice(0, 20),
  };
  writeFileSync(`${OUT}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

// ── Load ─────────────────────────────────────────────────────────────────

function load() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("Set SUPABASE_DB_URL to load.");
  const sql = `
\\set ON_ERROR_STOP on
begin;
-- Copying ~60MB over the network outlasts Supabase's default timeout.
set local statement_timeout = 0;
create temp table stage_vow (book_slug text, chapter smallint, verse smallint, words jsonb);
create temp table stage_map (book_slug text, chapter smallint, verse smallint, tokens jsonb);
truncate public.verse_word_map, public.verse_original_words, public.morphology_codes, public.strongs_entries;
\\copy public.strongs_entries (number, language, lemma, transliteration, pronunciation, derivation, definition, kjv_usage) from '${OUT}/strongs_entries.csv' with (format csv, header true)
\\copy public.morphology_codes (code, language, features) from '${OUT}/morphology_codes.csv' with (format csv, header true)
\\copy stage_vow from '${OUT}/verse_original_words.csv' with (format csv, header true)
\\copy stage_map from '${OUT}/verse_word_map.csv' with (format csv, header true)
insert into public.verse_original_words (book_id, chapter_number, verse_number, words)
select b.id, s.chapter, s.verse, s.words from stage_vow s join public.books b on b.slug = s.book_slug;
insert into public.verse_word_map (verse_id, tokens)
select v.id, s.tokens
from stage_map s
join public.books b on b.slug = s.book_slug
join public.translations t on t.slug = 'kjv'
join public.verses v on v.translation_id = t.id and v.book_id = b.id
  and v.chapter_number = s.chapter and v.verse_number = s.verse;
select (select count(*) from public.strongs_entries) as strongs_entries,
       (select count(*) from public.morphology_codes) as morphology_codes,
       (select count(*) from public.verse_original_words) as verse_original_words,
       (select count(*) from public.verse_word_map) as verse_word_map;
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
    execFileSync("psql", ["-q", "-f", "-"], { input: sql, env, stdio: ["pipe", "inherit", "inherit"] });
  } catch {
    throw new Error("Load failed (see psql output above); nothing was changed.");
  }
}

await downloadSources();
const report = build();
process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
if (process.argv.includes("--load")) load();
