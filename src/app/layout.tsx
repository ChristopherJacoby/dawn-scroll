import "@/lib/env";
import type { Metadata } from "next";
import { EB_Garamond, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/layout/Navigation";
import type { ReadingPreferences } from "@/context/reading-mode";
import { getUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/settings";
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

async function accountPreferences(): Promise<ReadingPreferences | null> {
    const user = await getUser();
    if (!user) return null;
    const settings = await getUserSettings(user.id);
    return { mode: settings.readingMode, fontScale: settings.fontScale };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const account = await accountPreferences();

    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} h-full antialiased`}
        >
            {/* Signed-in users get their saved mode server-rendered (no flash
                script needed); signed-out users fall back to the pre-paint
                script reading localStorage. suppressHydrationWarning covers
                the script-set attributes. */}
            <body
                className="min-h-full"
                data-reading-mode={account?.mode}
                style={
                    account
                        ? ({
                              "--reading-font-scale": String(
                                  account.fontScale / 100,
                              ),
                          } as React.CSSProperties)
                        : undefined
                }
                suppressHydrationWarning
            >
                {!account && (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `try{var m=localStorage.getItem("dawnscroll.reading-mode");if(m==="dark"||m==="sepia")document.body.dataset.readingMode=m;var f=Number(localStorage.getItem("dawnscroll.font-scale"));if(f>=80&&f<=140)document.body.style.setProperty("--reading-font-scale",String(f/100))}catch(e){}`,
                        }}
                    />
                )}
                <Providers account={account}>
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
