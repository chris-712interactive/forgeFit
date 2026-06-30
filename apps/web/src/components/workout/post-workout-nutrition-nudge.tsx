"use client";

import { buildPostWorkoutNutritionHref } from "@/lib/nutrition/date-param";
import {
  defaultMealTypeForTime,
  mealTypeLabel,
  persistPreferredMealType,
} from "@/lib/nutrition/meal-types";
import Link from "next/link";

export function PostWorkoutNutritionNudge() {
  const mealType = defaultMealTypeForTime();
  const href = buildPostWorkoutNutritionHref({ meal: mealType });

  function handleClick() {
    persistPreferredMealType(mealType);
  }

  return (
    <section className="mt-6 rounded-2xl border border-forge-coral/35 bg-forge-coral/5 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-coral">
        Refuel
      </p>
      <p className="mt-2 text-sm leading-relaxed text-forge-text">
        Log your post-workout meal while it&apos;s fresh — targets stay tied to
        today&apos;s training.
      </p>
      <p className="mt-1 text-xs text-forge-muted">
        Meal slot: {mealTypeLabel(mealType)}
      </p>
      <Link
        href={href}
        onClick={handleClick}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white"
      >
        Log post-workout meal
      </Link>
    </section>
  );
}
