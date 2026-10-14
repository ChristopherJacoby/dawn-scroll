import { rejectUntrustedMutation, resultResponse } from "@/lib/api";
import { removeHighlight } from "@/lib/highlights";

/** DELETE /api/highlights/:id — 204, or 404 if it isn't the user's. */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { id } = await params;
    return resultResponse(await removeHighlight(id), "highlight");
}
