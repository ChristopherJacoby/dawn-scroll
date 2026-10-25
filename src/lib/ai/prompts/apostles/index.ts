import type { Apostle } from "@/lib/ai/apostles";
import { ANDREW_PROMPT } from "./andrew";
import { BARTHOLOMEW_PROMPT } from "./bartholomew";
import { APOSTLE_BASE_PROMPT } from "./base";
import { JAMES_ALPHAEUS_PROMPT } from "./james-alphaeus";
import { JAMES_ZEBEDEE_PROMPT } from "./james-zebedee";
import { JOHN_PROMPT } from "./john";
import { MATTHEW_PROMPT } from "./matthew";
import { MATTHIAS_PROMPT } from "./matthias";
import { PAUL_PROMPT } from "./paul";
import { PETER_PROMPT } from "./peter";
import { PHILIP_PROMPT } from "./philip";
import { SIMON_ZEALOT_PROMPT } from "./simon-zealot";
import { THADDAEUS_PROMPT } from "./thaddaeus";
import { THOMAS_PROMPT } from "./thomas";

/** Each figure's biography, vantage point and voice, by apostle id. */
export const APOSTLE_PROMPTS: Record<string, string> = {
    peter: PETER_PROMPT,
    andrew: ANDREW_PROMPT,
    "james-zebedee": JAMES_ZEBEDEE_PROMPT,
    john: JOHN_PROMPT,
    philip: PHILIP_PROMPT,
    bartholomew: BARTHOLOMEW_PROMPT,
    matthew: MATTHEW_PROMPT,
    thomas: THOMAS_PROMPT,
    "james-alphaeus": JAMES_ALPHAEUS_PROMPT,
    thaddaeus: THADDAEUS_PROMPT,
    "simon-zealot": SIMON_ZEALOT_PROMPT,
    matthias: MATTHIAS_PROMPT,
    paul: PAUL_PROMPT,
};

/** The full system prompt for a figure: shared rules, then the figure. */
export function apostleSystemPrompt(apostle: Apostle): string {
    return `${APOSTLE_BASE_PROMPT}\n\nThe apostle you are portraying\n\n${APOSTLE_PROMPTS[apostle.id]}`;
}
