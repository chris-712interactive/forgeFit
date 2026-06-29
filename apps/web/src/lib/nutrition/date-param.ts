import { addDaysIso } from "@/lib/datetime/local-date";

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** How far back users can view or log nutrition entries. */
export const NUTRITION_LOOKBACK_DAYS = 90;

export function isIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value);
}

export function minNutritionLogDate(todayIso: string): string {
  return addDaysIso(todayIso, -NUTRITION_LOOKBACK_DAYS);
}

/** Clamp an optional ?date= query value to a valid, in-range calendar day. */
export function resolveNutritionDateParam(
  value: string | null | undefined,
  todayIso: string
): string {
  if (!value || !isIsoDate(value)) return todayIso;
  if (value > todayIso) return todayIso;
  const minDate = minNutritionLogDate(todayIso);
  if (value < minDate) return minDate;
  return value;
}

export function formatNutritionDayHeading(
  isoDate: string,
  todayIso: string,
  yesterdayIso: string
): string {
  if (isoDate === todayIso) return "Today";
  if (isoDate === yesterdayIso) return "Yesterday";

  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatNutritionDayShort(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function buildNutritionHref(options?: {
  date?: string;
  tab?: string;
  hash?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.tab && options.tab !== "today") params.set("tab", options.tab);

  const query = params.toString();
  const hash = options?.hash ? `#${options.hash}` : "";
  return query ? `/nutrition?${query}${hash}` : `/nutrition${hash}`;
}

export function buildNutritionLogHref(
  path: "log-macros" | "build-meal",
  date?: string
): string {
  if (!date) return `/nutrition/${path}`;
  return `/nutrition/${path}?date=${date}`;
}
