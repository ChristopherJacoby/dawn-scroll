"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { FindingVideo as Video } from "@/lib/archaeology/types";

/**
 * A YouTube video that loads only when played: until then it's a
 * thumbnail, so viewers aren't tracked and the page stays light. Plays
 * from youtube-nocookie.com.
 */
export function FindingVideo({ video }: { video: Video }) {
    const [playing, setPlaying] = useState(false);

    return (
        <figure className="flex flex-col gap-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-reading-divider bg-stone-night">
                {playing ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-reading-focus"
                    >
                        <Image
                            src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 42rem, 100vw"
                            className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-night/80 text-linen shadow-lg transition-transform group-hover:scale-105">
                                <Play
                                    className="ml-1 h-6 w-6 fill-current"
                                    aria-hidden="true"
                                />
                            </span>
                        </span>
                        <span className="sr-only">
                            Play video: {video.title}
                        </span>
                    </button>
                )}
            </div>
            <figcaption className="flex flex-col gap-1">
                <span className="font-sans text-sm font-semibold text-reading-text">
                    {video.title}
                </span>
                <span className="text-sm leading-relaxed text-reading-text-muted">
                    {video.note}
                </span>
                <span className="text-xs text-reading-text-muted">
                    {video.channel} · YouTube
                </span>
            </figcaption>
        </figure>
    );
}
