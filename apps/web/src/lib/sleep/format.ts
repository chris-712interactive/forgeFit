/** Pure formatting helpers — safe to import from Client Components. */

export function formatSleepHours(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "—";
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}
