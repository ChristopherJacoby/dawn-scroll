"use client";

import { useMemo } from "react";
import { type Apostle } from "@/lib/ai/apostles";
import { ChatView } from "./ChatView";
import type { Quota } from "./useChat";

export function ApostleChat({
    userId,
    apostle,
    initialQuota,
}: {
    userId: string;
    apostle: Apostle;
    initialQuota: Quota | null;
}) {
    const extraBody = useMemo(() => ({ figureId: apostle.id }), [apostle.id]);
    return (
        <ChatView
            variant="apostle"
            endpoint="/api/chat/apostle"
            storageKey={`dawnscroll.chat.apostle.${apostle.id}`}
            userId={userId}
            extraBody={extraBody}
            path={`/apostles/${apostle.id}`}
            initialQuota={initialQuota}
            title={apostle.name}
            subtitle={`${apostle.title} · speaking from ${apostle.vantage}`}
            avatar={apostle.initials}
            backLink={{ href: "/apostles", label: "All apostles" }}
            speaker={apostle.name}
            inputLabel={`Ask ${apostle.name}`}
            intro={() =>
                `Ask ${apostle.name} about his life, his world and what he saw. He knows only what he could have known in his own time.`
            }
            suggestions={() => [
                apostle.opener,
                "What was daily life like for you?",
                apostle.id === "paul"
                    ? "What did the apostles tell you about Jesus?"
                    : "What do you remember most about Jesus?",
            ]}
            disclaimer={`An AI portrayal of ${apostle.name} based on Scripture and early church tradition. It isn't ${apostle.name}, and it isn't Scripture. Prayer and the leading of the Holy Spirit come first; this is here to help you study.`}
        />
    );
}
