import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Credits | Dawnscroll",
    description: "Sources and licenses for the Bible text and study data.",
};

interface Credit {
    name: string;
    href: string;
    use: string;
    license: string;
    attribution?: string;
}

const CREDITS: { heading: string; items: Credit[] }[] = [
    {
        heading: "Bible text",
        items: [
            {
                name: "King James Version (Project Gutenberg eBook #10)",
                href: "https://www.gutenberg.org/ebooks/10",
                use: "The default translation.",
                license: "Public domain in the USA",
            },
            {
                name: "American Standard Version (eng-asv)",
                href: "https://ebible.org/find/details.php?id=eng-asv",
                use: "The ASV translation.",
                license: "Public domain",
                attribution: "eBible.org.",
            },
            {
                name: "World English Bible (engwebp)",
                href: "https://ebible.org/find/details.php?id=engwebp",
                use: "The WEB translation.",
                license: "Public domain",
                attribution:
                    "eBible.org. “World English Bible” is a trademark of eBible.org.",
            },
            {
                name: "Young’s Literal Translation (engylt)",
                href: "https://ebible.org/find/details.php?id=engylt",
                use: "The YLT translation.",
                license: "Public domain",
                attribution: "Robert Young (1898); eBible.org.",
            },
        ],
    },
    {
        heading: "Original languages",
        items: [
            {
                name: "King James Version with Strong's numbers (eng-kjv2006)",
                href: "https://ebible.org/find/details.php?id=eng-kjv2006",
                use: "Which Hebrew or Greek word each English word translates.",
                license: "Public domain",
                attribution:
                    "eBible.org; Strong's tagging from The Bible Foundation (Old Testament) and the CrossWire KJV2003 Project (New Testament).",
            },
            {
                name: "Strong's Greek Dictionary",
                href: "https://github.com/openscriptures/strongs",
                use: "Greek dictionary entries.",
                license: "Public domain",
                attribution:
                    "James Strong, Dictionary of the Greek Testament (1890); XML edition by Ulrik Petersen.",
            },
            {
                name: "Strong's Hebrew Dictionary (HebrewLexicon)",
                href: "https://github.com/openscriptures/HebrewLexicon",
                use: "Hebrew dictionary entries.",
                license: "CC BY 4.0 (dictionary text public domain)",
                attribution: "Open Scriptures Hebrew Bible Project.",
            },
            {
                name: "STEPBible Data: TAHOT, TAGNT, TEHMC and TEGMC",
                href: "https://github.com/STEPBible/STEPBible-Data",
                use: "The Hebrew and Greek words of each verse, their grammar, and in-context glosses.",
                license: "CC BY 4.0",
                attribution:
                    "STEPBible.org, based on work at Tyndale House, Cambridge.",
            },
        ],
    },
    {
        heading: "Photos",
        items: [
            {
                name: "Wikimedia Commons",
                href: "https://commons.wikimedia.org",
                use: "Photos of the archaeological finds.",
                license: "Public domain, CC0, CC BY 4.0 or CC BY-SA 4.0",
                attribution:
                    "Each photo is credited, with its license, on its finding’s page.",
            },
        ],
    },
    {
        heading: "Maps",
        items: [
            {
                name: "OpenFreeMap",
                href: "https://openfreemap.org",
                use: "Map tiles for the archaeology map.",
                license: "Map data ODbL (OpenStreetMap)",
                attribution:
                    "© OpenMapTiles; map data © OpenStreetMap contributors.",
            },
            {
                name: "MapLibre GL JS",
                href: "https://maplibre.org",
                use: "Draws the map.",
                license: "BSD 3-Clause",
            },
        ],
    },
];

export default function CreditsPage() {
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        Sources
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        Credits
                    </h1>
                    <p className="text-sm text-reading-text-muted">
                        Dawnscroll is built on freely licensed scholarship.
                        Thank you to everyone who made it available.
                    </p>
                </div>
                {CREDITS.map((group) => (
                    <section
                        key={group.heading}
                        aria-labelledby={`credits-${group.heading}`}
                        className="flex flex-col gap-4"
                    >
                        <h2
                            id={`credits-${group.heading}`}
                            className="text-xs font-medium uppercase tracking-wide text-reading-text-muted"
                        >
                            {group.heading}
                        </h2>
                        <ul className="flex flex-col gap-3">
                            {group.items.map((item) => (
                                <li
                                    key={item.name}
                                    className="flex flex-col gap-1 rounded-lg border border-reading-border-strong bg-reading-surface-raised p-4 text-sm"
                                >
                                    <a
                                        href={item.href}
                                        className="font-medium text-reading-link"
                                        rel="noreferrer"
                                    >
                                        {item.name}
                                    </a>
                                    <p className="text-reading-text">
                                        {item.use}
                                    </p>
                                    {item.attribution && (
                                        <p className="text-reading-text-muted">
                                            {item.attribution}
                                        </p>
                                    )}
                                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                                        {item.license}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
