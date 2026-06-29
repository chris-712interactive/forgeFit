"use client";

import type { SavedMeal } from "@/lib/nutrition/saved-meals";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import {
  NutritionDatePicker,
  useNutritionBackHref,
} from "@/components/nutrition/nutrition-date-picker";
import { useRouter } from "next/navigation";
import { MealBuilder } from "./meal-builder";
import { NutritionBackLink } from "./nutrition-back-link";

interface BuildMealScreenProps {
  loggedDate: string;
  selectedDate: string;
  todayIso: string;
  yesterdayIso: string;
  entryCount: number;
  initialMeal?: SavedMeal | null;
}

export function BuildMealScreen({
  loggedDate,
  selectedDate,
  todayIso,
  yesterdayIso,
  entryCount,
  initialMeal = null,
}: BuildMealScreenProps) {
  const router = useRouter();
  const backHref = useNutritionBackHref(todayIso);

  function goBack() {
    router.push(backHref);
  }

  return (
    <div className={appPagePadding}>
      <NutritionBackLink todayIso={todayIso} />

      <div className={appHeaderGap}>
        <h1 className="font-display text-2xl font-bold text-forge-text">
          Build meal
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Add ingredients, scale portions, and log the meal to your diary.
        </p>
      </div>

      <div className={`${appHeaderGap} ${appSectionStack}`}>
        <NutritionDatePicker
          selectedDate={selectedDate}
          todayIso={todayIso}
          yesterdayIso={yesterdayIso}
          entryCount={entryCount}
          compact
          basePath="/nutrition/build-meal"
        />

        <MealBuilder
          open
          loggedDate={loggedDate}
          initialMeal={initialMeal}
          onClose={goBack}
          onSaved={goBack}
        />
      </div>
    </div>
  );
}
