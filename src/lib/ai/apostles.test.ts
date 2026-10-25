import { describe, expect, it } from "vitest";
import { APOSTLES, BLOCKED_FIGURES, getApostle } from "./apostles";
import { APOSTLE_PROMPTS, apostleSystemPrompt } from "./prompts/apostles";
import { APOSTLE_BASE_PROMPT } from "./prompts/apostles/base";

describe("apostles", () => {
    it("lists the Twelve with Matthias, and Paul", () => {
        expect(APOSTLES).toHaveLength(13);
        expect(new Set(APOSTLES.map((a) => a.id)).size).toBe(13);
        expect(APOSTLES.map((a) => a.id)).not.toContain("judas-iscariot");
    });

    it("gives every figure a prompt, and no prompt without a figure", () => {
        expect(Object.keys(APOSTLE_PROMPTS).sort()).toEqual(
            APOSTLES.map((a) => a.id).sort(),
        );
        for (const apostle of APOSTLES) {
            const prompt = apostleSystemPrompt(apostle);
            expect(prompt.startsWith(APOSTLE_BASE_PROMPT)).toBe(true);
            expect(prompt).toContain(APOSTLE_PROMPTS[apostle.id]);
        }
    });

    it("never selects a blocked figure or an unknown id", () => {
        for (const id of [
            ...BLOCKED_FIGURES,
            "Jesus",
            "judas-iscariot",
            "",
            null,
            7,
        ]) {
            expect(getApostle(id)).toBeNull();
        }
        expect(getApostle("peter")?.name).toBe("Peter");
    });

    it("never names a blocked figure as an apostle", () => {
        const blocked = /\b(jesus|christ|god|holy spirit)\b/i;
        for (const apostle of APOSTLES) {
            expect(
                `${apostle.id} ${apostle.name} ${apostle.title}`,
            ).not.toMatch(blocked);
        }
    });

    it("keeps the guardrails in the shared rules", () => {
        expect(APOSTLE_BASE_PROMPT).toMatch(
            /never Jesus, God the Father or the Holy Spirit/,
        );
        expect(APOSTLE_BASE_PROMPT).toMatch(
            /Never invent sayings, teachings or deeds of his/,
        );
        expect(APOSTLE_BASE_PROMPT).toMatch(
            /don't know that writings from your time will be gathered/,
        );
        expect(APOSTLE_BASE_PROMPT).toMatch(
            /Earlier replies in it may not have come from you/,
        );
    });
});
