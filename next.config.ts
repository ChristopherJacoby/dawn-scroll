import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
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
