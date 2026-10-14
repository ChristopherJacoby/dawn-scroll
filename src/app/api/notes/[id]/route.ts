import { readJson, rejectUntrustedMutation, resultResponse } from "@/lib/api";
import { editNote, removeNote } from "@/lib/notes";

/** PUT /api/notes/:id — `{ content }`; 200, or 404 if it isn't the user's. */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const rejected = rejectUntrustedMutation(request, { hasBody: true });
    if (rejected) return rejected;
    const { id } = await params;
    return resultResponse(await editNote(id, await readJson(request)), "note");
}

/** DELETE /api/notes/:id — 204, or 404 if it isn't the user's. */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const rejected = rejectUntrustedMutation(request, { hasBody: false });
    if (rejected) return rejected;
    const { id } = await params;
    return resultResponse(await removeNote(id), "note");
}
