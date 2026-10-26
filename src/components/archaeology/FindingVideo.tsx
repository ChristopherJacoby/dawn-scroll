import type { FindingVideo as Video } from "@/lib/archaeology/types";

/**
 * A YouTube video in its own player, from youtube-nocookie.com. It loads
 * only as it scrolls into view and plays only when the reader presses
 * play.
 */
export function FindingVideo({ video }: { video: Video }) {
    return (
        <figure className="flex flex-col gap-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-reading-divider bg-stone-night">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                />
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
