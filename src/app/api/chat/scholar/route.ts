import { handleChatRequest } from "@/lib/ai/chat-route";
import { logAiError } from "@/lib/ai/log";
import { passageContext } from "@/lib/ai/passage";
import { SCHOLAR_SYSTEM_PROMPT } from "@/lib/ai/prompts/scholar";
import { retrieveContext } from "@/lib/ai/retrieval";

// A long, high-effort answer can stream for minutes; cut off early, the
// reply would just stop mid-sentence.
export const maxDuration = 300;

/**
 * POST /api/chat/scholar — `{ messages, passage? }`. Streams the Scholar's
 * reply, grounded in the passage being read and sources from Dawnscroll's
 * library.
 */
export async function POST(request: Request) {
    return handleChatRequest(request, "scholar", async () => ({
        speaker: "The Scholar",
        system: SCHOLAR_SYSTEM_PROMPT,
        context: async (turns, passage) => {
            const [passageText, sources] = await Promise.all([
                // Answers can do without the passage or sources, so a
                // lookup failure isn't fatal.
                passage
                    ? passageContext(passage).catch((error) => {
                          logAiError("Couldn't load the passage", error);
                          return null;
                      })
                    : null,
                retrieveContext(turns.at(-1)!.content).catch((error) => {
                    logAiError("Couldn't retrieve sources", error);
                    return "";
                }),
            ]);
            return [passageText, sources].filter(Boolean).join("\n\n");
        },
    }));
}
