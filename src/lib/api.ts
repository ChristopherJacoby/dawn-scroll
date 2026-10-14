import "server-only";

/** JSON error body in the shape every API route uses: `{ error }`. */
export function jsonError(message: string, status: number): Response {
    return Response.json({ error: message }, { status });
}

export function unauthorized(): Response {
    return jsonError("Sign in to continue.", 401);
}

/** Parsed JSON body, or undefined when the body isn't valid JSON. */
export async function readJson(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch {
        return undefined;
    }
}
