import { rejectUntrustedMutation, resultResponse } from "@/lib/api";
import { removeBookmark } from "@/lib/bookmarks";

/** DELETE /api/bookmarks/:id — 204, or 404 if it isn't the user's. */
export async function DELETE(
    request: Request,
    { params }: RouteContext<"/api/bookmarks/[id]">,
) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { id } = await params;
    return resultResponse(await removeBookmark(id), "bookmark");
}
