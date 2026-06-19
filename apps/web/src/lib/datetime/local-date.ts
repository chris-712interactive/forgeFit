/** Format a Date as YYYY-MM-DD in the given IANA timezone. */
export function formatIsoDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone(): string | null {
  if (typeof window === "undefined") return null;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Today's calendar date in the browser's local timezone (client-only). */
export function browserTodayIsoDate(reference = new Date()): string {
  const timeZone = browserTimeZone();
  if (!timeZone) {
    return formatIsoDate(reference, "UTC");
  }
  return formatIsoDate(reference, timeZone);
}

export function todayLocalIsoDate(
  reference = new Date(),
  timeZone = "UTC"
): string {
  return formatIsoDate(reference, timeZone);
}

export function yesterdayLocalIsoDate(
  reference = new Date(),
  timeZone = "UTC"
): string {
  return addDaysIso(todayLocalIsoDate(reference, timeZone), -1);
}

/** Shift a calendar ISO date by N days (timezone-neutral). */
export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
