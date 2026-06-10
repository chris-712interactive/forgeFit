import { getWeekBounds } from "@/lib/home/weekly-stats";

/** Calendar date for a plan weekday (Mon=0 … Sun=6) in the reference week. */
export function scheduledDateForDayIndex(
  dayIndex: number,
  referenceDate = new Date()
): Date {
  const { start } = getWeekBounds(referenceDate);
  const date = new Date(start);
  date.setDate(start.getDate() + dayIndex);
  return date;
}

export function formatScheduledSessionDate(
  dayIndex: number,
  referenceDate = new Date()
): string {
  return scheduledDateForDayIndex(dayIndex, referenceDate).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
    }
  );
}
