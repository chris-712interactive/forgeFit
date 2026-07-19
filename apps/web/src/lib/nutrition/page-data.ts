import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import {
  getDailyNutritionSummary,
  getDayLogCount,
  getDistinctNutritionLogDayCount,
  getRecentMacroEntries,
  todayIsoDate,
  yesterdayIsoDate,
} from "@/lib/nutrition/service";
import { resolveNutritionDateParam } from "@/lib/nutrition/date-param";
import { addDaysIso } from "@/lib/datetime/local-date";
import { getTdeeDashboard, type TdeeDashboard } from "@/lib/nutrition/tdee-service";
import type { DailyNutritionSummary, MacroQuickEntry } from "@/lib/nutrition/types";

export interface NutritionPageData {
  summary: DailyNutritionSummary | null;
  recentEntries: MacroQuickEntry[];
  selectedDate: string;
  todayIso: string;
  yesterdayIso: string;
  isViewingToday: boolean;
  previousDayDate: string;
  previousDayEntryCount: number;
  yesterdayEntryCount: number;
  yesterdayDate: string;
  restaurantSearchUnlocked: boolean;
  savedMealsUnlocked: boolean;
  tdeeDashboard: TdeeDashboard | null;
  nutritionLoggedDayCount: number;
}

export async function getNutritionPageData(
  userId: string | undefined,
  dateParam?: string | null
): Promise<NutritionPageData> {
  const [todayIso, yesterdayIso] = await Promise.all([
    todayIsoDate(),
    yesterdayIsoDate(),
  ]);
  const selectedDate = resolveNutritionDateParam(dateParam, todayIso);
  const previousDayDate = addDaysIso(selectedDate, -1);
  const isViewingToday = selectedDate === todayIso;

  if (!userId) {
    return {
      summary: null,
      recentEntries: [],
      selectedDate,
      todayIso,
      yesterdayIso,
      isViewingToday,
      previousDayDate,
      previousDayEntryCount: 0,
      yesterdayEntryCount: 0,
      yesterdayDate: yesterdayIso,
      restaurantSearchUnlocked: false,
      savedMealsUnlocked: false,
      tdeeDashboard: null,
      nutritionLoggedDayCount: 0,
    };
  }

  const [
    summary,
    recentEntries,
    previousDayEntryCount,
    yesterdayEntryCount,
    subscription,
    nutritionLoggedDayCount,
  ] = await Promise.all([
    getDailyNutritionSummary(userId, selectedDate),
    getRecentMacroEntries(userId),
    getDayLogCount(userId, previousDayDate),
    getDayLogCount(userId, yesterdayIso),
    getSubscriptionForUser(userId),
    getDistinctNutritionLogDayCount(userId),
  ]);

  const restaurantSearchUnlocked =
    subscription != null && hasFeature(subscription, "restaurant_search");
  const savedMealsUnlocked =
    subscription != null && hasFeature(subscription, "saved_meals");

  const tdeeDashboard =
    summary && isViewingToday
      ? await getTdeeDashboard(userId, summary, subscription)
      : null;

  return {
    summary,
    recentEntries,
    selectedDate,
    todayIso,
    yesterdayIso,
    isViewingToday,
    previousDayDate,
    previousDayEntryCount,
    yesterdayEntryCount,
    yesterdayDate: yesterdayIso,
    restaurantSearchUnlocked,
    savedMealsUnlocked,
    tdeeDashboard,
    nutritionLoggedDayCount,
  };
}
