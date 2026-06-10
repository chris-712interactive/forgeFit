/** Monday = 0 … Sunday = 6 (matches getWeekBounds / ISO week). */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function isoWeekdayFromDate(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * Spread sessions across the week starting on the anchor day (signup / program start).
 * Fills the rest of the current week first, then wraps to Mon+ if needed.
 */
export function assignSessionWeekdays(
  sessionCount: number,
  anchorWeekday: number
): number[] {
  if (sessionCount <= 0) return [];
  if (sessionCount === 1) return [anchorWeekday];

  const pool: number[] = [];
  for (let day = anchorWeekday; day < 7; day += 1) {
    pool.push(day);
  }
  for (let day = 0; day < anchorWeekday && pool.length < sessionCount; day += 1) {
    pool.push(day);
  }

  const picked: number[] = [];
  for (let i = 0; i < sessionCount; i += 1) {
    const idx = Math.round((i * (pool.length - 1)) / (sessionCount - 1));
    const weekday = pool[idx]!;
    if (!picked.includes(weekday)) {
      picked.push(weekday);
    }
  }

  for (const weekday of pool) {
    if (picked.length >= sessionCount) break;
    if (!picked.includes(weekday)) picked.push(weekday);
  }

  return picked.slice(0, sessionCount);
}

export function dayLabelForIndex(dayIndex: number): string {
  return DAY_LABELS[dayIndex % DAY_LABELS.length] ?? "Day";
}
