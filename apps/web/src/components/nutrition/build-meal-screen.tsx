"use client";

import type { SavedMeal } from "@/lib/nutrition/saved-meals";
import { useRouter } from "next/navigation";
import { MealBuilder } from "./meal-builder";

interface BuildMealScreenProps {
  loggedDate: string;
  initialMeal?: SavedMeal | null;
}

export function BuildMealScreen({
  loggedDate,
  initialMeal = null,
}: BuildMealScreenProps) {
  const router = useRouter();

  function goBack() {
    router.push("/nutrition");
  }

  return (
    <MealBuilder
      open
      loggedDate={loggedDate}
      initialMeal={initialMeal}
      onClose={goBack}
      onSaved={goBack}
    />
  );
}
