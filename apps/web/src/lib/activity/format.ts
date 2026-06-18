export function formatSedentaryHours(minutes: number | null): string {
  if (minutes == null) return "—";
  return `${(minutes / 60).toFixed(1)}h`;
}

export function formatCalories(value: number | null): string {
  if (value == null) return "—";
  return Math.round(value).toLocaleString();
}
