/** Monday = 0 … Sunday = 6 (matches getWeekBounds / ISO week). */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function isoWeekdayFromDate(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/** Local calendar date as YYYY-MM-DD for plan schedule anchoring. */
export function toScheduleStartIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseScheduleStartIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export interface AssignSessionWeekdaysOptions {
  /**
   * Regenerate path: prefer today through Sunday before wrapping to earlier weekdays.
   * Avoids scheduling "new" sessions on days that already passed this week when possible.
   */
  scheduleFromTodayOnly?: boolean;
  /** Weekdays to deprioritize (Mon=0 … Sun=6). Falls back if not enough open days remain. */
  blockedWeekdays?: number[];
}

function buildWeekdayPool(
  sessionCount: number,
  anchorWeekday: number,
  scheduleFromTodayOnly?: boolean
): number[] {
  const pool: number[] = [];
  for (let day = anchorWeekday; day < 7; day += 1) {
    pool.push(day);
  }

  const needsEarlierDays =
    !scheduleFromTodayOnly || pool.length < sessionCount;

  if (needsEarlierDays) {
    for (let day = 0; day < anchorWeekday && pool.length < sessionCount; day += 1) {
      pool.push(day);
    }
  }

  return pool;
}

function pickSpreadWeekdays(sessionCount: number, pool: number[]): number[] {
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

function firstAvailableWeekday(
  anchorWeekday: number,
  blocked: Set<number>
): number {
  for (let day = anchorWeekday; day < 7; day += 1) {
    if (!blocked.has(day)) return day;
  }
  for (let day = 0; day < anchorWeekday; day += 1) {
    if (!blocked.has(day)) return day;
  }
  return anchorWeekday;
}

function resolveWeekdayPool(
  sessionCount: number,
  anchorWeekday: number,
  options?: AssignSessionWeekdaysOptions
): number[] {
  const fullPool = buildWeekdayPool(
    sessionCount,
    anchorWeekday,
    options?.scheduleFromTodayOnly
  );
  const blocked = new Set(options?.blockedWeekdays ?? []);
  if (blocked.size === 0) return fullPool;

  const preferred = fullPool.filter((day) => !blocked.has(day));
  return preferred.length >= sessionCount ? preferred : fullPool;
}

/**
 * Spread sessions across the week starting on the anchor day (signup / program start).
 * Fills the rest of the current week first, then wraps to Mon+ if needed.
 */
export function assignSessionWeekdays(
  sessionCount: number,
  anchorWeekday: number,
  options?: AssignSessionWeekdaysOptions
): number[] {
  if (sessionCount <= 0) return [];
  if (sessionCount === 1) {
    const blocked = new Set(options?.blockedWeekdays ?? []);
    return [firstAvailableWeekday(anchorWeekday, blocked)];
  }

  const pool = resolveWeekdayPool(sessionCount, anchorWeekday, options);
  return pickSpreadWeekdays(sessionCount, pool);
}

export function dayLabelForIndex(dayIndex: number): string {
  return DAY_LABELS[dayIndex % DAY_LABELS.length] ?? "Day";
}
