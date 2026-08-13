const STORAGE_KEY = "dawnscroll.search-scroll";

/**
 * The search page's results load asynchronously, so the browser's native
 * back/forward scroll restoration fires while the page is still empty and
 * clamps to the top. These helpers save the position when leaving via a
 * result link and restore it once results have re-rendered.
 */
export function saveSearchScrollPosition() {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, String(window.scrollY));
    } catch {
        // Storage unavailable — restoration just won't happen.
    }
}

export function consumeSearchScrollPosition(): number | null {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (raw === null) return null;
        window.sessionStorage.removeItem(STORAGE_KEY);
        const value = Number(raw);
        return Number.isFinite(value) && value >= 0 ? value : null;
    } catch {
        return null;
    }
}
