import Image from "next/image";
import type { FindingImage } from "@/lib/archaeology/types";
import { cn } from "@/lib/cn";

function sourceLabel(url: string): string {
    return new URL(url).hostname === "commons.wikimedia.org"
        ? "Wikimedia Commons"
        : "source";
}

/** "Photo: Oren Rozen · CC BY-SA 4.0 · via Wikimedia Commons", linked. */
export function ImageCredit({ image }: { image: FindingImage }) {
    return (
        <span className="text-xs text-reading-text-muted">
            Photo: {image.credit} ·{" "}
            {image.licenseUrl ? (
                <a
                    href={image.licenseUrl}
                    className="text-reading-link"
                    rel="noreferrer license"
                >
                    {image.license}
                </a>
            ) : (
                image.license
            )}{" "}
            · via{" "}
            <a
                href={image.sourceUrl}
                className="text-reading-link"
                rel="noreferrer"
            >
                {sourceLabel(image.sourceUrl)}
            </a>
        </span>
    );
}

/** A finding's photo with its caption and credit. */
export function FindingFigure({
    image,
    preload = false,
    sizes,
    className,
}: {
    image: FindingImage;
    preload?: boolean;
    sizes: string;
    className?: string;
}) {
    return (
        <figure className={cn("flex flex-col gap-2", className)}>
            <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes={sizes}
                preload={preload}
                className="h-auto w-full rounded-lg border border-reading-divider bg-reading-bg-subtle"
            />
            <figcaption className="flex flex-col gap-0.5 font-sans text-sm text-reading-text">
                {image.caption}
                <ImageCredit image={image} />
            </figcaption>
        </figure>
    );
}
