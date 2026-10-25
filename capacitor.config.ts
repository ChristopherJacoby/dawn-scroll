import type { CapacitorConfig } from "@capacitor/cli";

// Dawnscroll renders on the server (auth, AI chat, search, Stripe), so
// there's no static export to bundle: the apps load the live site.
// CAPACITOR_SERVER_URL points them at another server, such as a dev
// machine on the local network (http://192.168.x.x:3000).
const serverUrl =
    process.env.CAPACITOR_SERVER_URL ?? "https://www.dawnscroll.com";

const config: CapacitorConfig = {
    appId: "com.dawnscroll.app",
    appName: "Dawnscroll",
    // Only the page shown when the site can't be reached.
    webDir: "capacitor/www",
    server: {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        errorPath: "offline.html",
    },
};

export default config;
