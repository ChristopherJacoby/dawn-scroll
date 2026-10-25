import "server-only";

/**
 * Whether Google sign-in is switched on in Supabase (Authentication →
 * Providers). Read from the project's public auth settings, so the button
 * appears by itself once the provider is configured. Cached for five
 * minutes; any failure hides the button rather than breaking the page.
 */
export async function isGoogleSignInEnabled(): Promise<boolean> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
            {
                headers: {
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
                },
                next: { revalidate: 300 },
            },
        );
        if (!response.ok) return false;
        const settings = (await response.json()) as {
            external?: { google?: boolean };
        };
        return settings.external?.google === true;
    } catch {
        return false;
    }
}
