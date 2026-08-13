import "@/lib/env";
import type { Metadata } from "next";
import { EB_Garamond, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/layout/Navigation";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
    variable: "--font-eb-garamond",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Dawnscroll",
    description: "Read, explore, and understand the Bible",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} h-full antialiased`}
        >
            {/* suppressHydrationWarning: the pre-paint script below sets
                data-reading-mode before React hydrates */}
            <body className="min-h-full" suppressHydrationWarning>
                {/* Pre-paint: apply the saved reading mode before first render
                    so a dark/sepia user never sees a flash of light mode. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try{var m=localStorage.getItem("dawnscroll.reading-mode");if(m==="dark"||m==="sepia")document.body.dataset.readingMode=m}catch(e){}`,
                    }}
                />
                <Providers>
                    <div className="flex min-h-full">
                        <Navigation />
                        {/* pt-14 offsets the fixed mobile top bar; removed on md+ */}
                        <main className="flex flex-1 flex-col pt-14 md:pt-0">
                            {children}
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
