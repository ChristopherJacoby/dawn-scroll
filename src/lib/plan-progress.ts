/**
 * Reading-plan progress math, shared by server and client. Plans are
 * self-paced: "today's reading" is the first day not yet completed.
 */

export interface PlanReading {
    bookSlug: string;
    bookName: string;
    startChapter: number;
    endChapter: number;
}

/** "Genesis 1–3", "Psalms 23". */
export function readingLabel(reading: PlanReading): string {
    const { bookName, startChapter, endChapter } = reading;
    return endChapter > startChapter
        ? `${bookName} ${startChapter}–${endChapter}`
        : `${bookName} ${startChapter}`;
}

/** The first day (1-based) not in `completedDays`, or null when all done. */
export function nextDay(
    completedDays: Iterable<number>,
    durationDays: number,
): number | null {
    const done = new Set(completedDays);
    for (let day = 1; day <= durationDays; day++) {
        if (!done.has(day)) return day;
    }
    return null;
}

/** Calendar date (YYYY-MM-DD) of an instant in a time zone. */
function localDate(instant: Date, timeZone: string): string {
    // en-CA formats as YYYY-MM-DD.
    return instant.toLocaleDateString("en-CA", { timeZone });
}

function previousDate(date: string): string {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

/**
 * Consecutive calendar days, in the reader's time zone, with at least one
 * completed reading, ending today, or ending yesterday if nothing is done
 * yet today (the streak isn't broken until a whole day is missed).
 */
export function computeStreak(
    completedAt: Iterable<string>,
    now: Date,
    timeZone: string,
): number {
    const days = new Set(
        Array.from(completedAt, (iso) => localDate(new Date(iso), timeZone)),
    );
    let day = localDate(now, timeZone);
    if (!days.has(day)) day = previousDate(day);
    let streak = 0;
    while (days.has(day)) {
        streak++;
        day = previousDate(day);
    }
    return streak;
}
