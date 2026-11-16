import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
    headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    // Nothing embeds the app, so no other site may frame it.
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors 'none'",
                    },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
    redirects() {
        return [
            // The tradition was renamed Resurrection Day (DS-139).
            {
                source: "/roots/easter",
                destination: "/roots/resurrection-day",
                permanent: true,
            },
        ];
    },
    images: {
        // Archaeology photos in the public "findings" storage bucket.
        remotePatterns: supabaseUrl
            ? [
                  {
                      protocol: "https",
                      hostname: new URL(supabaseUrl).hostname,
                      port: "",
                      pathname: "/storage/v1/object/public/findings/**",
                      search: "",
                  },
              ]
            : [],
    },
};

export default nextConfig;
