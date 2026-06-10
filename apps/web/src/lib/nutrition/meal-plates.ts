import type { MacroTotals } from "@forgefit/nutrition-core";
import type { NutritionTargets } from "@forgefit/program-engine";

export type MealSlot = "breakfast" | "lunch" | "dinner";

export interface MealFoodExample {
  name: string;
  portion: string;
  role: "protein" | "carbs" | "produce" | "fat";
  macros: MacroTotals;
}

export interface MealPlateExample {
  meal: MealSlot;
  label: string;
  emoji: string;
  shareLabel: string;
  targets: MacroTotals;
  foods: MealFoodExample[];
}

const MEAL_SHARE: Record<MealSlot, { label: string; ratio: number }> = {
  breakfast: { label: "~30% of daily", ratio: 0.3 },
  lunch: { label: "~35% of daily", ratio: 0.35 },
  dinner: { label: "~35% of daily", ratio: 0.35 },
};

const PLATE_TEMPLATES: Record<MealSlot, Omit<MealPlateExample, "targets">> = {
  breakfast: {
    meal: "breakfast",
    label: "Breakfast",
    emoji: "🌅",
    shareLabel: MEAL_SHARE.breakfast.label,
    foods: [
      {
        name: "Scrambled eggs",
        portion: "2 large",
        role: "protein",
        macros: { calories: 140, proteinG: 12, carbsG: 1, fatG: 10 },
      },
      {
        name: "Oatmeal",
        portion: "½ cup cooked",
        role: "carbs",
        macros: { calories: 150, proteinG: 5, carbsG: 27, fatG: 3 },
      },
      {
        name: "Greek yogurt",
        portion: "¾ cup",
        role: "protein",
        macros: { calories: 130, proteinG: 18, carbsG: 8, fatG: 2 },
      },
      {
        name: "Blueberries",
        portion: "½ cup",
        role: "produce",
        macros: { calories: 40, proteinG: 0, carbsG: 10, fatG: 0 },
      },
    ],
  },
  lunch: {
    meal: "lunch",
    label: "Lunch",
    emoji: "☀️",
    shareLabel: MEAL_SHARE.lunch.label,
    foods: [
      {
        name: "Grilled chicken",
        portion: "5 oz",
        role: "protein",
        macros: { calories: 230, proteinG: 43, carbsG: 0, fatG: 5 },
      },
      {
        name: "Brown rice",
        portion: "1 cup cooked",
        role: "carbs",
        macros: { calories: 220, proteinG: 5, carbsG: 45, fatG: 2 },
      },
      {
        name: "Mixed greens",
        portion: "2 cups + 1 tsp olive oil",
        role: "produce",
        macros: { calories: 80, proteinG: 2, carbsG: 4, fatG: 7 },
      },
      {
        name: "Apple",
        portion: "1 medium",
        role: "carbs",
        macros: { calories: 95, proteinG: 0, carbsG: 25, fatG: 0 },
      },
    ],
  },
  dinner: {
    meal: "dinner",
    label: "Dinner",
    emoji: "🌙",
    shareLabel: MEAL_SHARE.dinner.label,
    foods: [
      {
        name: "Salmon",
        portion: "5 oz",
        role: "protein",
        macros: { calories: 280, proteinG: 39, carbsG: 0, fatG: 12 },
      },
      {
        name: "Sweet potato",
        portion: "1 medium roasted",
        role: "carbs",
        macros: { calories: 180, proteinG: 4, carbsG: 41, fatG: 0 },
      },
      {
        name: "Broccoli",
        portion: "1½ cups",
        role: "produce",
        macros: { calories: 55, proteinG: 4, carbsG: 11, fatG: 0 },
      },
      {
        name: "Avocado",
        portion: "¼ fruit",
        role: "fat",
        macros: { calories: 80, proteinG: 1, carbsG: 4, fatG: 7 },
      },
    ],
  },
};

export function mealTargetsFromDaily(
  targets: NutritionTargets,
  meal: MealSlot
): MacroTotals {
  const ratio = MEAL_SHARE[meal].ratio;
  return {
    calories: Math.round(targets.calories * ratio),
    proteinG: Math.round(targets.proteinG * ratio),
    carbsG: Math.round(targets.carbsG * ratio),
    fatG: Math.round(targets.fatG * ratio),
  };
}

export function sumPlateMacros(foods: MealFoodExample[]): MacroTotals {
  return foods.reduce(
    (sum, food) => ({
      calories: sum.calories + food.macros.calories,
      proteinG: sum.proteinG + food.macros.proteinG,
      carbsG: sum.carbsG + food.macros.carbsG,
      fatG: sum.fatG + food.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

export function buildMealPlateExamples(
  targets: NutritionTargets | null
): MealPlateExample[] {
  if (!targets) return [];

  return (["breakfast", "lunch", "dinner"] as MealSlot[]).map((meal) => ({
    ...PLATE_TEMPLATES[meal],
    targets: mealTargetsFromDaily(targets, meal),
  }));
}

export const FOOD_ROLE_COLORS: Record<MealFoodExample["role"], string> = {
  protein: "bg-forge-coral/20 border-forge-coral/40 text-forge-coral",
  carbs: "bg-forge-gold/20 border-forge-gold/40 text-forge-gold",
  produce: "bg-forge-success/15 border-forge-success/35 text-forge-success",
  fat: "bg-forge-steel/15 border-forge-steel/35 text-forge-steel",
};
