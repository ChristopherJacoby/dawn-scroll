"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import {
    VerseActionButton,
    VerseActionLabel,
} from "@/components/reader/VerseActionBar";
import { useToast } from "@/context/toast";

interface CopyVerseActionProps {
    text: string;
    reference: string;
    translation: string;
}

export function CopyVerseAction({
    text,
    reference,
    translation,
}: CopyVerseActionProps) {
    const toast = useToast();
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(
                `${text}\n— ${reference} ${translation}`,
            );
            // Confirmed inline: a toast would sit on top of the action bar
            // on narrow screens.
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy to the clipboard.");
        }
    }

    return (
        <>
            <VerseActionButton onClick={copy}>
                {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                <VerseActionLabel>
                    {copied ? "Copied" : "Copy"}
                </VerseActionLabel>
            </VerseActionButton>
            <span role="status" className="sr-only">
                {copied ? `Copied ${reference}` : ""}
            </span>
        </>
    );
}
