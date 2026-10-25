/**
 * The figures readers can talk with in Apostle mode: the Twelve (with
 * Matthias, chosen to replace Judas Iscariot) and Paul. Jesus, God and the
 * Holy Spirit are never portrayed; see BLOCKED_FIGURES.
 */

export interface Apostle {
    id: string;
    name: string;
    /** How they're known, for cards and headers. */
    title: string;
    /** One line of biography for the gallery card. */
    fact: string;
    /** When and where the portrayal speaks from. */
    vantage: string;
    initials: string;
    /** A first question suited to this figure, for the chat's suggestions. */
    opener: string;
}

export const APOSTLES: Apostle[] = [
    {
        id: "peter",
        name: "Peter",
        title: "Simon Peter, the fisherman",
        fact: "A Galilean fisherman who denied Jesus three times, then led the first believers in Jerusalem.",
        vantage: "Rome, early AD 64",
        initials: "Pe",
        opener: "What happened the night you denied him?",
    },
    {
        id: "andrew",
        name: "Andrew",
        title: "Brother of Peter",
        fact: "A disciple of John the Baptist who brought his brother Simon to Jesus.",
        vantage: "around AD 50",
        initials: "An",
        opener: "What did you learn from John the Baptist?",
    },
    {
        id: "james-zebedee",
        name: "James",
        title: "Son of Zebedee",
        fact: "One of the inner three with Peter and John, and the first of the Twelve to be martyred.",
        vantage: "Jerusalem, around AD 43",
        initials: "Ja",
        opener: "What did you see on the mountain?",
    },
    {
        id: "john",
        name: "John",
        title: "Son of Zebedee",
        fact: "James's brother, one of the inner three, and in long tradition the disciple Jesus loved.",
        vantage: "Ephesus, around AD 90",
        initials: "Jn",
        opener: "What was it like at the foot of the cross?",
    },
    {
        id: "philip",
        name: "Philip",
        title: "Of Bethsaida",
        fact: 'Called as Jesus set out for Galilee, he told Nathanael, "Come and see."',
        vantage: "around AD 50",
        initials: "Ph",
        opener: "Why did you tell Nathanael to come and see?",
    },
    {
        id: "bartholomew",
        name: "Bartholomew",
        title: "Traditionally Nathanael of Cana",
        fact: "Named in every list of the Twelve, and traditionally identified with Nathanael, whom Philip brought to Jesus.",
        vantage: "around AD 50",
        initials: "Ba",
        opener: "What did you mean about Nazareth?",
    },
    {
        id: "matthew",
        name: "Matthew",
        title: "The tax collector",
        fact: "Called Levi in Mark and Luke, he left his toll booth at Capernaum to follow Jesus.",
        vantage: "around AD 50",
        initials: "Ma",
        opener: "What was it like to be a tax collector?",
    },
    {
        id: "thomas",
        name: "Thomas",
        title: "Called the Twin",
        fact: 'He doubted the resurrection until he saw for himself, then said, "My Lord and my God."',
        vantage: "around AD 50",
        initials: "Th",
        opener: "What made you finally believe?",
    },
    {
        id: "james-alphaeus",
        name: "James",
        title: "Son of Alphaeus",
        fact: "One of the Twelve about whom the Gospels record little beyond his name.",
        vantage: "around AD 50",
        initials: "JA",
        opener: "What was an ordinary day with the Twelve like?",
    },
    {
        id: "thaddaeus",
        name: "Thaddaeus",
        title: "Also called Judas of James",
        fact: "At the Last Supper he asked why Jesus would show himself to the disciples and not to the world.",
        vantage: "around AD 50",
        initials: "Td",
        opener: "What did you ask him at the last supper?",
    },
    {
        id: "simon-zealot",
        name: "Simon",
        title: "The Zealot",
        fact: "Called the Zealot or the Cananaean, a name that may mean zeal for the Law or for Israel's freedom.",
        vantage: "around AD 50",
        initials: "Si",
        opener: "How did a zealot end up beside a tax collector?",
    },
    {
        id: "matthias",
        name: "Matthias",
        title: "Chosen to replace Judas",
        fact: "He followed Jesus from John's baptism to the ascension, and was chosen by lot to join the Twelve.",
        vantage: "around AD 50",
        initials: "Mt",
        opener: "What was it like to be chosen by lot?",
    },
    {
        id: "paul",
        name: "Paul",
        title: "Apostle to the Gentiles",
        fact: "A Pharisee who persecuted the church until he met the risen Jesus on the road to Damascus.",
        vantage: "Rome, around AD 62",
        initials: "Pa",
        opener: "What happened on the road to Damascus?",
    },
];

/**
 * Never portrayed, whatever the request: these are worshiped, not
 * role-played. Only APOSTLES can be chosen anyway; this list keeps any
 * future figure from reusing these ids, and the prompts carry the real
 * guardrail.
 */
export const BLOCKED_FIGURES = [
    "jesus",
    "christ",
    "god",
    "holy-spirit",
    "spirit",
];

export function getApostle(id: unknown): Apostle | null {
    if (typeof id !== "string" || BLOCKED_FIGURES.includes(id)) return null;
    return APOSTLES.find((a) => a.id === id) ?? null;
}
