import { rejectUntrustedMutation, resultResponse } from "@/lib/api";
import { enroll, leave } from "@/lib/reading-plans";

type Context = { params: Promise<{ slug: string }> };

/** PUT /api/plans/:slug/enrollment — start the plan (201, or 200 if already). */
export async function PUT(request: Request, { params }: Context) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { slug } = await params;
    const result = await enroll(slug);
    return result.ok
        ? new Response(null, { status: result.status })
        : resultResponse(result, "enrollment");
}

/** DELETE /api/plans/:slug/enrollment — leave the plan and erase progress. */
export async function DELETE(request: Request, { params }: Context) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { slug } = await params;
    return resultResponse(await leave(slug), "enrollment");
}
