#!/usr/bin/env node
/* eslint-disable no-console */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const MANIFEST_PATH = resolve(ROOT, 'data/kjv/source-manifest.json');
const RAW_PATH = resolve(ROOT, 'data/kjv/raw/kjv-gutenberg-10.txt');
const JSON_PATH = resolve(ROOT, 'data/kjv/kjv.normalized.json');
const SQL_PATH = resolve(ROOT, 'data/kjv/kjv.seed.sql');
const REPORT_PATH = resolve(ROOT, 'data/kjv/validation-report.json');

const BOOKS = [
  ['Gen','genesis','Genesis','Gen','old',50], ['Exod','exodus','Exodus','Exod','old',40], ['Lev','leviticus','Leviticus','Lev','old',27], ['Num','numbers','Numbers','Num','old',36], ['Deut','deuteronomy','Deuteronomy','Deut','old',34], ['Josh','joshua','Joshua','Josh','old',24], ['Judg','judges','Judges','Judg','old',21], ['Ruth','ruth','Ruth','Ruth','old',4], ['1Sam','1-samuel','1 Samuel','1 Sam','old',31], ['2Sam','2-samuel','2 Samuel','2 Sam','old',24], ['1Kgs','1-kings','1 Kings','1 Kgs','old',22], ['2Kgs','2-kings','2 Kings','2 Kgs','old',25], ['1Chr','1-chronicles','1 Chronicles','1 Chr','old',29], ['2Chr','2-chronicles','2 Chronicles','2 Chr','old',36], ['Ezra','ezra','Ezra','Ezra','old',10], ['Neh','nehemiah','Nehemiah','Neh','old',13], ['Esth','esther','Esther','Esth','old',10], ['Job','job','Job','Job','old',42], ['Ps','psalms','Psalms','Ps','old',150], ['Prov','proverbs','Proverbs','Prov','old',31], ['Eccl','ecclesiastes','Ecclesiastes','Eccl','old',12], ['Song','song-of-solomon','Song of Solomon','Song','old',8], ['Isa','isaiah','Isaiah','Isa','old',66], ['Jer','jeremiah','Jeremiah','Jer','old',52], ['Lam','lamentations','Lamentations','Lam','old',5], ['Ezek','ezekiel','Ezekiel','Ezek','old',48], ['Dan','daniel','Daniel','Dan','old',12], ['Hos','hosea','Hosea','Hos','old',14], ['Joel','joel','Joel','Joel','old',3], ['Amos','amos','Amos','Amos','old',9], ['Obad','obadiah','Obadiah','Obad','old',1], ['Jonah','jonah','Jonah','Jonah','old',4], ['Mic','micah','Micah','Mic','old',7], ['Nah','nahum','Nahum','Nah','old',3], ['Hab','habakkuk','Habakkuk','Hab','old',3], ['Zeph','zephaniah','Zephaniah','Zeph','old',3], ['Hag','haggai','Haggai','Hag','old',2], ['Zech','zechariah','Zechariah','Zech','old',14], ['Mal','malachi','Malachi','Mal','old',4], ['Matt','matthew','Matthew','Matt','new',28], ['Mark','mark','Mark','Mark','new',16], ['Luke','luke','Luke','Luke','new',24], ['John','john','John','John','new',21], ['Acts','acts','Acts','Acts','new',28], ['Rom','romans','Romans','Rom','new',16], ['1Cor','1-corinthians','1 Corinthians','1 Cor','new',16], ['2Cor','2-corinthians','2 Corinthians','2 Cor','new',13], ['Gal','galatians','Galatians','Gal','new',6], ['Eph','ephesians','Ephesians','Eph','new',6], ['Phil','philippians','Philippians','Phil','new',4], ['Col','colossians','Colossians','Col','new',4], ['1Thess','1-thessalonians','1 Thessalonians','1 Thess','new',5], ['2Thess','2-thessalonians','2 Thessalonians','2 Thess','new',3], ['1Tim','1-timothy','1 Timothy','1 Tim','new',6], ['2Tim','2-timothy','2 Timothy','2 Tim','new',4], ['Titus','titus','Titus','Titus','new',3], ['Phlm','philemon','Philemon','Phlm','new',1], ['Heb','hebrews','Hebrews','Heb','new',13], ['Jas','james','James','Jas','new',5], ['1Pet','1-peter','1 Peter','1 Pet','new',5], ['2Pet','2-peter','2 Peter','2 Pet','new',3], ['1John','1-john','1 John','1 John','new',5], ['2John','2-john','2 John','2 John','new',1], ['3John','3-john','3 John','3 John','new',1], ['Jude','jude','Jude','Jude','new',1], ['Rev','revelation','Revelation','Rev','new',22]
].map(([osisId, slug, name, abbreviation, testament, chaptersCount], index) => ({ osisId, slug, name, abbreviation, testament, chaptersCount, order: index + 1 }));


const HEADING_ALIASES = new Map([
  ['the first book of moses: called genesis', 'Gen'], ['the second book of moses: called exodus', 'Exod'], ['the third book of moses: called leviticus', 'Lev'], ['the fourth book of moses: called numbers', 'Num'], ['the fifth book of moses: called deuteronomy', 'Deut'],
  ['the book of joshua', 'Josh'], ['the book of judges', 'Judg'], ['the book of ruth', 'Ruth'], ['the first book of samuel', '1Sam'], ['the second book of samuel', '2Sam'], ['the first book of the kings', '1Kgs'], ['the second book of the kings', '2Kgs'], ['the first book of the chronicles', '1Chr'], ['the second book of the chronicles', '2Chr'], ['ezra', 'Ezra'], ['the book of nehemiah', 'Neh'], ['the book of esther', 'Esth'], ['the book of job', 'Job'], ['the book of psalms', 'Ps'], ['the proverbs', 'Prov'], ['ecclesiastes', 'Eccl'], ['the song of solomon', 'Song'], ['the book of the prophet isaiah', 'Isa'], ['the book of the prophet jeremiah', 'Jer'], ['the lamentations of jeremiah', 'Lam'], ['the book of the prophet ezekiel', 'Ezek'], ['the book of daniel', 'Dan'], ['hosea', 'Hos'], ['joel', 'Joel'], ['amos', 'Amos'], ['obadiah', 'Obad'], ['jonah', 'Jonah'], ['micah', 'Mic'], ['nahum', 'Nah'], ['habakkuk', 'Hab'], ['zephaniah', 'Zeph'], ['haggai', 'Hag'], ['zechariah', 'Zech'], ['malachi', 'Mal'],
  ['the gospel according to saint matthew', 'Matt'], ['the gospel according to saint mark', 'Mark'], ['the gospel according to saint luke', 'Luke'], ['the gospel according to saint john', 'John'], ['the acts of the apostles', 'Acts'], ['the epistle of paul the apostle to the romans', 'Rom'], ['the first epistle of paul the apostle to the corinthians', '1Cor'], ['the second epistle of paul the apostle to the corinthians', '2Cor'], ['the epistle of paul the apostle to the galatians', 'Gal'], ['the epistle of paul the apostle to the ephesians', 'Eph'], ['the epistle of paul the apostle to the philippians', 'Phil'], ['the epistle of paul the apostle to the colossians', 'Col'], ['the first epistle of paul the apostle to the thessalonians', '1Thess'], ['the second epistle of paul the apostle to the thessalonians', '2Thess'], ['the first epistle of paul the apostle to timothy', '1Tim'], ['the second epistle of paul the apostle to timothy', '2Tim'], ['the epistle of paul the apostle to titus', 'Titus'], ['the epistle of paul the apostle to philemon', 'Phlm'], ['the epistle of paul the apostle to the hebrews', 'Heb'], ['the general epistle of james', 'Jas'], ['the first epistle general of peter', '1Pet'], ['the second general epistle of peter', '2Pet'], ['the first epistle general of john', '1John'], ['the second epistle general of john', '2John'], ['the third epistle general of john', '3John'], ['the general epistle of jude', 'Jude'], ['the revelation of saint john the divine', 'Rev']
]);
const BOOK_BY_OSIS = new Map(BOOKS.map((book) => [book.osisId, book]));

const EXPECTED_TOTALS = { books: 66, chapters: 1189, verses: 31102 };

async function ensureDir(path) { await mkdir(dirname(path), { recursive: true }); }
function sha256(text) { return createHash('sha256').update(text).digest('hex'); }
function normalizeText(text) { return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').normalize('NFC'); }
function sql(value) { return value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`; }

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function loadSource(manifest) {
  const input = argValue('--input');
  if (input) return readFile(resolve(ROOT, input), 'utf8');
  if (process.argv.includes('--from-cache')) return readFile(RAW_PATH, 'utf8');
  const response = await fetch(manifest.source.url, { headers: { 'User-Agent': 'dawn-scroll-kjv-import/1.0' } });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  const text = await response.text();
  await ensureDir(RAW_PATH);
  await writeFile(RAW_PATH, text);
  return text;
}

function parseVerses(raw) {
  const text = normalizeText(raw);
  let currentBook = null;
  let ignoreNextHeading = false;
  let currentVerse = null;
  const verses = [];
  const finishVerse = () => {
    if (!currentVerse) return;
    verses.push({ ...currentVerse, text: currentVerse.text.trim().replace(/\s+/g, ' ') });
    currentVerse = null;
  };
  const appendVerseText = (value) => {
    if (!currentVerse || !value.trim()) return;
    currentVerse.text = `${currentVerse.text} ${value.trim()}`;
  };
  for (const line of text.split('\n')) {
    const trimmed = line.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;
    if (trimmed.toLowerCase() === 'otherwise called:') {
      ignoreNextHeading = true;
      continue;
    }
    const headingBook = BOOK_BY_OSIS.get(HEADING_ALIASES.get(trimmed.toLowerCase()));
    if (headingBook) {
      finishVerse();
      if (ignoreNextHeading) ignoreNextHeading = false;
      else currentBook = headingBook;
      continue;
    }
    if (!currentBook) continue;
    ignoreNextHeading = false;
    const matches = [...trimmed.matchAll(/(\d+):(\d+)(?:\s+|$)/g)];
    if (matches.length === 0) {
      appendVerseText(trimmed);
      continue;
    }
    let cursor = 0;
    for (const match of matches) {
      const prefix = trimmed.slice(cursor, match.index).trim();
      appendVerseText(prefix);
      finishVerse();
      currentVerse = {
        book: currentBook.osisId,
        chapter: Number(match[1]),
        verse: Number(match[2]),
        text: '',
      };
      cursor = match.index + match[0].length;
    }
    appendVerseText(trimmed.slice(cursor));
  }
  finishVerse();
  return { text, verses };
}

function validate(verses, manifest, checksum) {
  const allowPartial = process.argv.includes('--allow-partial');
  const errors = [];
  const warnings = [];
  const seen = new Set();
  const byBook = new Map(BOOKS.map((book) => [book.osisId, { book, chapters: new Map(), verses: 0 }]));
  for (const item of verses) {
    const key = `${item.book}.${item.chapter}.${item.verse}`;
    if (seen.has(key)) errors.push(`Duplicate verse reference ${key}`);
    seen.add(key);
    if (!item.text || item.text.trim() === '') errors.push(`Empty verse text at ${key}`);
    const bucket = byBook.get(item.book);
    if (!bucket) errors.push(`Unknown book ${item.book}`);
    else {
      if (!bucket.chapters.has(item.chapter)) bucket.chapters.set(item.chapter, 0);
      bucket.chapters.set(item.chapter, bucket.chapters.get(item.chapter) + 1);
      bucket.verses += 1;
    }
  }
  for (const { book, chapters } of byBook.values()) {
    if (!allowPartial && chapters.size !== book.chaptersCount) errors.push(`${book.name} has ${chapters.size} chapters; expected ${book.chaptersCount}`);
    if (!allowPartial) {
      for (let chapter = 1; chapter <= book.chaptersCount; chapter += 1) {
        if (!chapters.has(chapter)) errors.push(`${book.name} is missing chapter ${chapter}`);
      }
      for (const chapter of chapters.keys()) {
        if (chapter < 1 || chapter > book.chaptersCount) errors.push(`${book.name} has unexpected chapter ${chapter}`);
      }
    }
  }
  const byChapter = new Map();
  for (const item of verses) {
    const key = `${item.book}.${item.chapter}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key).push(item.verse);
  }
  for (const [key, chapterVerses] of byChapter.entries()) {
    const unique = [...new Set(chapterVerses)].sort((a, b) => a - b);
    for (let index = 0; index < unique.length; index += 1) {
      const expected = index + 1;
      if (unique[index] !== expected) errors.push(`${key} verse sequence has ${unique[index]} at position ${expected}`);
    }
  }
  if (!allowPartial && verses.length !== EXPECTED_TOTALS.verses) errors.push(`Parsed ${verses.length} verses; expected ${EXPECTED_TOTALS.verses}`);
  if (!allowPartial && manifest.source.expectedSha256 && manifest.source.expectedSha256 !== checksum) errors.push(`Source checksum ${checksum} does not match manifest ${manifest.source.expectedSha256}`);
  if (!allowPartial) {
    const spotChecks = [
      ['Gen', 1, 1, 'In the beginning God created the heaven and the earth.'],
      ['Ps', 23, 1, 'The LORD is my shepherd; I shall not want.'],
      ['Isa', 53, 5, 'But he was wounded for our transgressions, he was bruised for our iniquities:'],
      ['Matt', 5, 9, 'Blessed are the peacemakers: for they shall be called the children of God.'],
      ['John', 1, 1, 'In the beginning was the Word, and the Word was with God, and the Word was God.'],
      ['John', 3, 16, 'For God so loved the world, that he gave his only begotten Son,'],
      ['Rom', 8, 28, 'And we know that all things work together for good to them that love God,'],
      ['1Cor', 13, 4, 'Charity suffereth long, and is kind; charity envieth not;'],
      ['Rev', 1, 8, 'I am Alpha and Omega, the beginning and the ending, saith the Lord,'],
      ['Rev', 22, 21, 'The grace of our Lord Jesus Christ be with you all. Amen.'],
    ];
    for (const [book, chapter, verse, expectedStart] of spotChecks) {
      const found = verses.find((item) => item.book === book && item.chapter === chapter && item.verse === verse);
      if (!found) errors.push(`Missing spot-check verse ${book}.${chapter}.${verse}`);
      else if (!found.text.startsWith(expectedStart)) errors.push(`Spot-check mismatch at ${book}.${chapter}.${verse}`);
    }
  }
  const coveredBooks = [...byBook.values()].filter(({ chapters }) => chapters.size > 0).length;
  if (allowPartial) warnings.push('Partial validation allowed; full-canon totals were not enforced.');
  return { ok: errors.length === 0, errors, warnings, totals: { books: coveredBooks, chapters: [...byBook.values()].reduce((sum, b) => sum + b.chapters.size, 0), verses: verses.length } };
}

function buildSql(manifest, checksum, verses) {
  const t = manifest.translation, s = manifest.source;
  const lines = ['begin;', `insert into public.translations (slug, abbreviation, name, language_code, versification, copyright_notice, rights_statement, is_public_domain, is_enabled, metadata) values (${sql(t.slug)}, ${sql(t.abbreviation)}, ${sql(t.name)}, ${sql(t.languageCode)}, ${sql(t.versification)}, ${sql('Public domain in the USA')}, ${sql(s.license)}, true, true, ${sql(JSON.stringify({ sourceManifest: 'data/kjv/source-manifest.json' }))}::jsonb) on conflict (slug) do update set abbreviation = excluded.abbreviation, name = excluded.name, language_code = excluded.language_code, versification = excluded.versification, copyright_notice = excluded.copyright_notice, rights_statement = excluded.rights_statement, is_public_domain = excluded.is_public_domain, is_enabled = excluded.is_enabled, metadata = excluded.metadata;`];
  for (const b of BOOKS) lines.push(`insert into public.books (osis_id, slug, name, common_abbreviation, testament, book_order, chapters_count) values (${sql(b.osisId)}, ${sql(b.slug)}, ${sql(b.name)}, ${sql(b.abbreviation)}, ${sql(b.testament)}, ${b.order}, ${b.chaptersCount}) on conflict (osis_id) do update set slug = excluded.slug, name = excluded.name, common_abbreviation = excluded.common_abbreviation, testament = excluded.testament, book_order = excluded.book_order, chapters_count = excluded.chapters_count;`);
  lines.push(`insert into public.data_sources (translation_id, source_key, source_type, title, url, license, attribution, checksum_sha256, imported_at, metadata) select id, ${sql(s.key)}, ${sql(s.type)}, ${sql(s.title)}, ${sql(s.url)}, ${sql(s.license)}, ${sql(s.attribution)}, ${sql(checksum)}, now(), ${sql(JSON.stringify({ catalogUrl: s.catalogUrl, accessedOn: s.accessedOn }))}::jsonb from public.translations where slug = ${sql(t.slug)} on conflict (source_key) do update set translation_id = excluded.translation_id, source_type = excluded.source_type, title = excluded.title, url = excluded.url, license = excluded.license, attribution = excluded.attribution, checksum_sha256 = excluded.checksum_sha256, imported_at = excluded.imported_at, metadata = excluded.metadata;`);
  for (const v of verses) lines.push(`insert into public.verses (translation_id, book_id, chapter_number, verse_number, verse_text, source_id) select tr.id, b.id, ${v.chapter}, ${v.verse}, ${sql(v.text)}, ds.id from public.translations tr join public.books b on b.osis_id = ${sql(v.book)} join public.data_sources ds on ds.source_key = ${sql(s.key)} where tr.slug = ${sql(t.slug)} on conflict (translation_id, book_id, chapter_number, verse_number) do update set verse_text = excluded.verse_text, source_id = excluded.source_id;`);
  lines.push('commit;');
  return `${lines.join('\n')}\n`;
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const raw = await loadSource(manifest);
const checksum = sha256(normalizeText(raw));
const parsed = parseVerses(raw);
const validation = validate(parsed.verses, manifest, checksum);
const report = { generatedAt: new Date().toISOString(), source: { ...manifest.source, computedSha256: checksum }, normalization: { unicode: 'NFC', newlines: 'LF', verseWhitespace: 'collapsed internal whitespace' }, expectedTotals: EXPECTED_TOTALS, ...validation };
const partialMode = process.argv.includes('--allow-partial');
if (!partialMode) {
  await ensureDir(JSON_PATH);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}
if (!validation.ok) {
  console.error(partialMode ? 'KJV import validation failed.' : `KJV import validation failed. See ${REPORT_PATH}`);
  for (const error of validation.errors) console.error(`- ${error}`);
  process.exit(1);
}
if (!partialMode) {
  await writeFile(JSON_PATH, `${JSON.stringify({ translation: manifest.translation, source: { key: manifest.source.key, checksumSha256: checksum }, books: BOOKS, verses: parsed.verses }, null, 2)}\n`);
  await writeFile(SQL_PATH, buildSql(manifest, checksum, parsed.verses));
}
console.log(`KJV import complete: ${validation.totals.verses} verses, checksum ${checksum}`);
