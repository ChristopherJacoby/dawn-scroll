import { jsonError, unauthorized } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { deleteBookmark } from "@/lib/bookmarks";
import { isUuid } from "@/lib/verse-ref";

/** DELETE /api/bookmarks/:id — 204, or 404 if it isn't the user's. */
export async function DELETE(
    _request: Request,
    { params }: RouteContext<"/api/bookmarks/[id]">,
) {
    if (!(await getUser())) return unauthorized();

    const { id } = await params;
    if (!isUuid(id)) return jsonError("Bookmark not found.", 404);

    try {
        const deleted = await deleteBookmark(id);
        if (!deleted) return jsonError("Bookmark not found.", 404);
        return new Response(null, { status: 204 });
    } catch {
        return jsonError(
            "Couldn't remove the bookmark. Please try again.",
            500,
        );
    }
}
