"use client";

import type { PassageRef } from "@/lib/ai/chat";
import { ChatView } from "./ChatView";
import type { Quota } from "./useChat";

const GENERAL_SUGGESTIONS = [
    "Who were the Pharisees?",
    "How did weddings work in first-century Judea?",
    "Who was Pontius Pilate?",
    "What was the Feast of Tabernacles?",
];

export function ScholarChat({
    userId,
    passage,
    initialQuota,
}: {
    userId: string;
    passage: PassageRef | null;
    initialQuota: Quota | null;
}) {
    return (
        <ChatView
            endpoint="/api/chat/scholar"
            storageKey="dawnscroll.chat.scholar"
            userId={userId}
            path="/scholar"
            passage={passage}
            initialQuota={initialQuota}
            title="Scholar"
            subtitle="The history and culture behind the Bible."
            speaker="Scholar"
            inputLabel="Ask the Scholar"
            intro={(label) =>
                label
                    ? `Ask about ${label}: its setting, customs, people and places.`
                    : "Ask about the customs, laws, festivals, places and people of the biblical world. Answers start from Scripture and cite the passages they rely on."
            }
            suggestions={(label) =>
                label
                    ? [
                          `What's the historical background of ${label}?`,
                          "What customs would the first readers have recognized here?",
                          "Who are the people and places in this passage?",
                      ]
                    : GENERAL_SUGGESTIONS
            }
            disclaimer="The Scholar can make mistakes; check its answers against Scripture."
        />
    );
}
