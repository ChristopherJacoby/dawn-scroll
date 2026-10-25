/** "2026-10-14" → "October 14, 2026" (a calendar date, so no time zone). */
export function formatCalendarDate(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
