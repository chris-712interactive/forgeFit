import { addDaysIso } from "@/lib/datetime/local-date";
import { isMealType, type MealType } from "@/lib/nutrition/meal-types";

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
  meal?: MealType;
}): string {
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.tab && options.tab !== "today") params.set("tab", options.tab);
  if (options?.meal) params.set("meal", options.meal);

  const query = params.toString();
  const hash = options?.hash ? `#${options.hash}` : "";
  return query ? `/nutrition?${query}${hash}` : `/nutrition${hash}`;
}

export function buildNutritionLogHref(
  path: "log-macros" | "build-meal",
  options?: { date?: string; meal?: MealType }
): string {
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.meal) params.set("meal", options.meal);

  const query = params.toString();
  return query ? `/nutrition/${path}?${query}` : `/nutrition/${path}`;
}

/** Deep link after a workout — pre-selects meal slot on log-macros. */
export function buildPostWorkoutNutritionHref(options?: {
  date?: string;
  meal?: MealType;
}): string {
  return buildNutritionLogHref("log-macros", options);
}

export function parseNutritionMealParam(
  value: string | null | undefined
): MealType | undefined {
  return isMealType(value) ? value : undefined;
}
