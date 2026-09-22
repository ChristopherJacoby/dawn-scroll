/** Shared narrow layout for auth pages: eyebrow, serif title, body. */
export function AuthShell({
    eyebrow = "Dawnscroll",
    title,
    children,
}: {
    eyebrow?: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-full w-full flex-col bg-reading-bg">
            <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 py-12 md:px-10 md:py-16">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-reading-text-muted">
                        {eyebrow}
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-reading-text">
                        {title}
                    </h1>
                </div>
                {children}
            </div>
        </div>
    );
}
