import { rejectUntrustedMutation, resultResponse } from "@/lib/api";
import { setDayComplete } from "@/lib/reading-plans";

type Context = { params: Promise<{ slug: string; day: string }> };

/** PUT /api/plans/:slug/days/:day — mark the day complete (idempotent). */
export async function PUT(request: Request, { params }: Context) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { slug, day } = await params;
    const result = await setDayComplete(slug, day, true);
    return result.ok
        ? new Response(null, { status: result.status })
        : resultResponse(result, "day");
}

/** DELETE /api/plans/:slug/days/:day — mark the day not complete. */
export async function DELETE(request: Request, { params }: Context) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { slug, day } = await params;
    return resultResponse(await setDayComplete(slug, day, false), "day");
}
