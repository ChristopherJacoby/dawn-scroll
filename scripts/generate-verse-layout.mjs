#!/usr/bin/env node
// Builds src/lib/bible/verse-layout.json: for every chapter, which verses
// start a paragraph, which are poetry lines, and where stanzas break, taken
// from the World English Bible's USFM. The reader's paragraph layout uses it
// for every translation, since they share the KJV's verse divisions.
//
//   node scripts/generate-verse-layout.mjs
//
// Only verse-level structure carries over: poetry lines inside a verse are
// the WEB's wording, so a poetry verse is one line in our layout.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const DIR = `${ROOT}data/layout`;
const RAW = `${DIR}/raw`;
const MANIFEST_PATH = `${DIR}/source-manifest.json`;
const OUT_PATH = `${ROOT}src/lib/bible/verse-layout.json`;

// USFM book codes to our book slugs.
const SLUG_BY_USFM = new Map([
  ["GEN", "genesis"], ["EXO", "exodus"], ["LEV", "leviticus"], ["NUM", "numbers"], ["DEU", "deuteronomy"],
  ["JOS", "joshua"], ["JDG", "judges"], ["RUT", "ruth"], ["1SA", "1-samuel"], ["2SA", "2-samuel"],
  ["1KI", "1-kings"], ["2KI", "2-kings"], ["1CH", "1-chronicles"], ["2CH", "2-chronicles"], ["EZR", "ezra"],
  ["NEH", "nehemiah"], ["EST", "esther"], ["JOB", "job"], ["PSA", "psalms"], ["PRO", "proverbs"],
  ["ECC", "ecclesiastes"], ["SNG", "song-of-solomon"], ["ISA", "isaiah"], ["JER", "jeremiah"], ["LAM", "lamentations"],
  ["EZK", "ezekiel"], ["DAN", "daniel"], ["HOS", "hosea"], ["JOL", "joel"], ["AMO", "amos"],
  ["OBA", "obadiah"], ["JON", "jonah"], ["MIC", "micah"], ["NAM", "nahum"], ["HAB", "habakkuk"],
  ["ZEP", "zephaniah"], ["HAG", "haggai"], ["ZEC", "zechariah"], ["MAL", "malachi"], ["MAT", "matthew"],
  ["MRK", "mark"], ["LUK", "luke"], ["JHN", "john"], ["ACT", "acts"], ["ROM", "romans"],
  ["1CO", "1-corinthians"], ["2CO", "2-corinthians"], ["GAL", "galatians"], ["EPH", "ephesians"], ["PHP", "philippians"],
  ["COL", "colossians"], ["1TH", "1-thessalonians"], ["2TH", "2-thessalonians"], ["1TI", "1-timothy"], ["2TI", "2-timothy"],
  ["TIT", "titus"], ["PHM", "philemon"], ["HEB", "hebrews"], ["JAS", "james"], ["1PE", "1-peter"],
  ["2PE", "2-peter"], ["1JN", "1-john"], ["2JN", "2-john"], ["3JN", "3-john"], ["JUD", "jude"], ["REV", "revelation"],
]);

// Paragraph-level markers: prose paragraphs, poetry lines, stanza breaks.
const PROSE = new Set(["p", "m", "pi", "pi1", "pi2", "pmo", "pm", "nb", "mi", "pc", "li", "li1", "li2"]);
const POETRY = new Set(["q", "q1", "q2", "q3", "qc", "qr", "qm", "qm1", "qm2"]);

async function download() {
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
  const dest = `${RAW}/usfm`;
  mkdirSync(dest, { recursive: true });
  execFileSync("unzip", ["-q", "-o", path, "-d", dest]);
  return dest;
}

/** [[1, 6], [9, 9]] from [1, 2, 3, 4, 5, 6, 9]. */
function toRanges(numbers) {
  const ranges = [];
  for (const n of numbers) {
    const last = ranges.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else ranges.push([n, n]);
  }
  return ranges;
}

function parseBook(text) {
  const chapters = {};
  let chapter = null;
  let mode = "prose";
  // What the next verse to start inherits: a paragraph or stanza break.
  let pendingBreak = null;
  let current = null;
  const chapterLayout = () => (chapters[chapter] ??= { p: [], q: [], b: [] });

  // Every \marker in order, with \v's number.
  for (const match of text.matchAll(/\\([a-z]+\d?)\*?(?:\s+(\d+))?/g)) {
    const [, marker, number] = match;
    if (marker === "c") {
      chapter = Number(number);
      mode = "prose";
      pendingBreak = "p";
    } else if (PROSE.has(marker)) {
      mode = "prose";
      pendingBreak = "p";
    } else if (POETRY.has(marker)) {
      // A new poetry line inside a verse is the WEB's wording; only the
      // mode matters at verse level.
      if (mode !== "poetry") pendingBreak ??= "p";
      mode = "poetry";
    } else if (marker === "b") {
      pendingBreak = "b";
    } else if (marker === "v" && chapter !== null) {
      current = Number(number);
      const layout = chapterLayout();
      if (pendingBreak === "p" || current === 1) layout.p.push(current);
      if (pendingBreak === "b") layout.b.push(current);
      if (mode === "poetry") layout.q.push(current);
      pendingBreak = null;
    }
  }
  for (const layout of Object.values(chapters)) layout.q = toRanges(layout.q);
  return chapters;
}

const dir = await download();
const layout = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith(".usfm")).sort()) {
  const text = readFileSync(`${dir}/${file}`, "utf8");
  const code = text.match(/^\\id\s+(\w+)/m)?.[1];
  const slug = SLUG_BY_USFM.get(code);
  if (slug) layout[slug] = parseBook(text);
}

const missing = [...SLUG_BY_USFM.values()].filter((slug) => !layout[slug]);
if (missing.length) throw new Error(`No USFM for: ${missing.join(", ")}`);
writeFileSync(OUT_PATH, `${JSON.stringify(layout)}\n`);
process.stderr.write(`Wrote ${OUT_PATH} (${Object.keys(layout).length} books)\n`);
