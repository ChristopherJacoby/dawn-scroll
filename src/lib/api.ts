import "server-only";
import type { Result } from "@/lib/result";

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

/**
 * CSRF guard for cookie-authenticated mutations. Session cookies are
 * SameSite=Lax, which stops cross-site POSTs but not same-site ones (e.g. a
 * sibling subdomain posting a text/plain form), so mutations must come from
 * this exact origin and, when they carry a body, be JSON — which a plain
 * HTML form can't send. Returns an error response, or null to proceed.
 */
export function rejectUntrustedMutation(
    request: Request,
    { hasBody }: { hasBody: boolean },
): Response | null {
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin") {
        return jsonError("Cross-origin requests aren't allowed.", 403);
    }
    const origin = request.headers.get("origin");
    if (!fetchSite && origin) {
        const host =
            request.headers.get("x-forwarded-host") ??
            request.headers.get("host");
        if (URL.canParse(origin) && new URL(origin).host !== host) {
            return jsonError("Cross-origin requests aren't allowed.", 403);
        }
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (hasBody && !contentType.startsWith("application/json")) {
        return jsonError("Send a JSON body.", 415);
    }
    return null;
}

/** Map a mutation Result to a response: `{ [key]: value }`, or 204 for null. */
export function resultResponse<T>(result: Result<T>, key: string): Response {
    if (!result.ok) return jsonError(result.error, result.status);
    if (result.value === null) return new Response(null, { status: 204 });
    return Response.json({ [key]: result.value }, { status: result.status });
}
