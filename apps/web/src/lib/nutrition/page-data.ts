import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import {
  getDailyNutritionSummary,
  getDayLogCount,
  getRecentMacroEntries,
  yesterdayIsoDate,
} from "@/lib/nutrition/service";
import type { DailyNutritionSummary, MacroQuickEntry } from "@/lib/nutrition/types";

export interface NutritionPageData {
  summary: DailyNutritionSummary | null;
  recentEntries: MacroQuickEntry[];
  yesterdayEntryCount: number;
  yesterdayDate: string;
  restaurantSearchUnlocked: boolean;
}

export async function getNutritionPageData(
  userId: string | undefined
): Promise<NutritionPageData> {
  const yesterdayDate = await yesterdayIsoDate();

  if (!userId) {
    return {
      summary: null,
      recentEntries: [],
      yesterdayEntryCount: 0,
      yesterdayDate,
      restaurantSearchUnlocked: false,
    };
  }

  const [summary, recentEntries, yesterdayEntryCount, subscription] =
    await Promise.all([
      getDailyNutritionSummary(userId),
      getRecentMacroEntries(userId),
      getDayLogCount(userId, yesterdayDate),
      getSubscriptionForUser(userId),
    ]);

  const restaurantSearchUnlocked =
    subscription != null && hasFeature(subscription, "restaurant_search");

  return {
    summary,
    recentEntries,
    yesterdayEntryCount,
    yesterdayDate,
    restaurantSearchUnlocked,
  };
}
