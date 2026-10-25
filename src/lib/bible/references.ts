/**
 * Finds Bible references such as "John 3:16", "1 Corinthians 13:4-7" or
 * "Genesis 1" in free text (AI answers), for linking to the reader. Uses a
 * static book list so it runs in the browser without a lookup.
 */

/** [slug, name, abbreviation, chapter count], in canonical order. */
const BOOKS: [string, string, string, number][] = [
    ["genesis", "Genesis", "Gen", 50],
    ["exodus", "Exodus", "Exod", 40],
    ["leviticus", "Leviticus", "Lev", 27],
    ["numbers", "Numbers", "Num", 36],
    ["deuteronomy", "Deuteronomy", "Deut", 34],
    ["joshua", "Joshua", "Josh", 24],
    ["judges", "Judges", "Judg", 21],
    ["ruth", "Ruth", "Ruth", 4],
    ["1-samuel", "1 Samuel", "1 Sam", 31],
    ["2-samuel", "2 Samuel", "2 Sam", 24],
    ["1-kings", "1 Kings", "1 Kgs", 22],
    ["2-kings", "2 Kings", "2 Kgs", 25],
    ["1-chronicles", "1 Chronicles", "1 Chr", 29],
    ["2-chronicles", "2 Chronicles", "2 Chr", 36],
    ["ezra", "Ezra", "Ezra", 10],
    ["nehemiah", "Nehemiah", "Neh", 13],
    ["esther", "Esther", "Esth", 10],
    ["job", "Job", "Job", 42],
    ["psalms", "Psalms", "Ps", 150],
    ["proverbs", "Proverbs", "Prov", 31],
    ["ecclesiastes", "Ecclesiastes", "Eccl", 12],
    ["song-of-solomon", "Song of Solomon", "Song", 8],
    ["isaiah", "Isaiah", "Isa", 66],
    ["jeremiah", "Jeremiah", "Jer", 52],
    ["lamentations", "Lamentations", "Lam", 5],
    ["ezekiel", "Ezekiel", "Ezek", 48],
    ["daniel", "Daniel", "Dan", 12],
    ["hosea", "Hosea", "Hos", 14],
    ["joel", "Joel", "Joel", 3],
    ["amos", "Amos", "Amos", 9],
    ["obadiah", "Obadiah", "Obad", 1],
    ["jonah", "Jonah", "Jonah", 4],
    ["micah", "Micah", "Mic", 7],
    ["nahum", "Nahum", "Nah", 3],
    ["habakkuk", "Habakkuk", "Hab", 3],
    ["zephaniah", "Zephaniah", "Zeph", 3],
    ["haggai", "Haggai", "Hag", 2],
    ["zechariah", "Zechariah", "Zech", 14],
    ["malachi", "Malachi", "Mal", 4],
    ["matthew", "Matthew", "Matt", 28],
    ["mark", "Mark", "Mark", 16],
    ["luke", "Luke", "Luke", 24],
    ["john", "John", "John", 21],
    ["acts", "Acts", "Acts", 28],
    ["romans", "Romans", "Rom", 16],
    ["1-corinthians", "1 Corinthians", "1 Cor", 16],
    ["2-corinthians", "2 Corinthians", "2 Cor", 13],
    ["galatians", "Galatians", "Gal", 6],
    ["ephesians", "Ephesians", "Eph", 6],
    ["philippians", "Philippians", "Phil", 4],
    ["colossians", "Colossians", "Col", 4],
    ["1-thessalonians", "1 Thessalonians", "1 Thess", 5],
    ["2-thessalonians", "2 Thessalonians", "2 Thess", 3],
    ["1-timothy", "1 Timothy", "1 Tim", 6],
    ["2-timothy", "2 Timothy", "2 Tim", 4],
    ["titus", "Titus", "Titus", 3],
    ["philemon", "Philemon", "Phlm", 1],
    ["hebrews", "Hebrews", "Heb", 13],
    ["james", "James", "Jas", 5],
    ["1-peter", "1 Peter", "1 Pet", 5],
    ["2-peter", "2 Peter", "2 Pet", 3],
    ["1-john", "1 John", "1 John", 5],
    ["2-john", "2 John", "2 John", 1],
    ["3-john", "3 John", "3 John", 1],
    ["jude", "Jude", "Jude", 1],
    ["revelation", "Revelation", "Rev", 22],
];

/** Other names writers use. */
const ALIASES: Record<string, string> = {
    Psalm: "psalms",
    "Song of Songs": "song-of-solomon",
};

const CHAPTERS = new Map(BOOKS.map(([slug, , , chapters]) => [slug, chapters]));

/** Full names (and aliases) may stand alone with a chapter: "Genesis 1". */
const FULL_NAMES = new Map<string, string>([
    ...BOOKS.map(([slug, name]): [string, string] => [name, slug]),
    ...Object.entries(ALIASES),
]);
/** Abbreviations need a verse too ("Gen 1:1"), to avoid false matches. */
const ABBREVIATIONS = new Map(
    BOOKS.filter(([, name, abbr]) => abbr && abbr !== name).map(
        ([slug, , abbr]) => [abbr, slug],
    ),
);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const names = [...FULL_NAMES.keys(), ...ABBREVIATIONS.keys()]
    // Longest first, so "1 John" wins over "John" and "Song of Songs" over "Song".
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|");
const REFERENCE = new RegExp(
    `(?<![\\p{L}\\d])(${names})\\.?\\s+(\\d{1,3})(?::(\\d{1,3})(?:\\s?[-–]\\s?\\d{1,3}(?::\\d{1,3})?)?)?(?![\\p{L}\\d]|:\\d)`,
    "gu",
);

export interface VerseReference {
    /** Offsets of the reference in the searched text. */
    start: number;
    end: number;
    href: string;
}

/** Every valid reference in `text`, in order. */
export function findVerseReferences(text: string): VerseReference[] {
    const found: VerseReference[] = [];
    for (const match of text.matchAll(REFERENCE)) {
        const [whole, book, chapterText, verseText] = match;
        const isFullName = FULL_NAMES.has(book);
        const slug = FULL_NAMES.get(book) ?? ABBREVIATIONS.get(book);
        const chapter = Number(chapterText);
        if (!slug || chapter < 1 || chapter > (CHAPTERS.get(slug) ?? 0))
            continue;
        if (!verseText && !isFullName) continue;
        const verse = verseText ? Number(verseText) : null;
        if (verse === 0) continue;
        found.push({
            start: match.index,
            end: match.index + whole.length,
            href: `/read/${slug}/${chapter}${verse ? `#verse-${verse}` : ""}`,
        });
    }
    return found;
}

/** A book's display name, for showing a passage reference. */
export function bookName(slug: string): string | null {
    return BOOKS.find(([s]) => s === slug)?.[1] ?? null;
}
