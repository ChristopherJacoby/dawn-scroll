"use client";

import { logOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

/** Saved AI conversations live in this tab's sessionStorage. */
function clearSavedChats() {
    try {
        for (const key of Object.keys(sessionStorage)) {
            if (key.startsWith("dawnscroll.chat.")) {
                sessionStorage.removeItem(key);
            }
        }
    } catch {
        // Storage unavailable: nothing saved.
    }
}

export function LogOutButton() {
    return (
        <form action={logOut} onSubmit={clearSavedChats}>
            <Button type="submit" variant="secondary" size="sm">
                Log out
            </Button>
        </form>
    );
}
