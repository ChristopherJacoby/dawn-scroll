import "server-only";
import { headers } from "next/headers";

let warned = false;

/**
 * The origin to put in links that leave the app: auth emails and Stripe
 * return URLs. Set SITE_URL in production. A request's Host and
 * X-Forwarded-Host headers come from the client unless the platform
 * overwrites them, and an email link built from a forged host would send
 * a real sign-in code to someone else's site.
 *
 * Without SITE_URL (local development, preview deployments) the origin
 * comes from the request, as the platform reports it.
 */
export async function siteOrigin(): Promise<string> {
    const configured = process.env.SITE_URL;
    if (configured) return new URL(configured).origin;

    if (process.env.NODE_ENV === "production" && !warned) {
        warned = true;
        // eslint-disable-next-line no-console -- server-side diagnostics
        console.warn(
            "SITE_URL is not set: building links from request headers. Set SITE_URL to the site's public origin.",
        );
    }
    const h = await headers();
    // Only a platform that sets X-Forwarded-Host itself can be trusted
    // to have replaced a client-supplied one.
    const forwarded = process.env.VERCEL ? h.get("x-forwarded-host") : null;
    const host = forwarded ?? h.get("host") ?? "localhost:3000";
    const proto =
        h.get("x-forwarded-proto") ??
        (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto}://${host}`;
}
