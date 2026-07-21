import { Skeleton } from "@/components/ui/Skeleton";

export default function ReaderLoading() {
    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-8 md:px-10 md:py-12">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-56" />
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_9rem]">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
            </div>
            <div className="flex flex-col gap-5">
                {Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className="flex gap-3">
                        <Skeleton className="h-5 w-7 shrink-0" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
