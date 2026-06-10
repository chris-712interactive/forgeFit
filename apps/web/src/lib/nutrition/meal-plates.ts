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

interface FoodTemplate {
  name: string;
  role: MealFoodExample["role"];
  macros: MacroTotals;
  formatPortion: (scale: number) => string;
}

const MEAL_SHARE: Record<MealSlot, { label: string; ratio: number }> = {
  breakfast: { label: "~30% of daily", ratio: 0.3 },
  lunch: { label: "~35% of daily", ratio: 0.35 },
  dinner: { label: "~35% of daily", ratio: 0.35 },
};

const MACRO_TOP_OFFS: Record<"protein" | "carbs" | "fat", MealFoodExample> = {
  protein: {
    name: "Protein shake",
    portion: "1 scoop w/ water",
    role: "protein",
    macros: { calories: 120, proteinG: 24, carbsG: 3, fatG: 1 },
  },
  carbs: {
    name: "Banana",
    portion: "1 medium",
    role: "carbs",
    macros: { calories: 105, proteinG: 1, carbsG: 27, fatG: 0 },
  },
  fat: {
    name: "Almonds",
    portion: "1 oz",
    role: "fat",
    macros: { calories: 160, proteinG: 6, carbsG: 6, fatG: 14 },
  },
};

const PLATE_TEMPLATES: Record<
  MealSlot,
  Omit<MealPlateExample, "targets" | "foods">
> = {
  breakfast: {
    meal: "breakfast",
    label: "Breakfast",
    emoji: "🌅",
    shareLabel: MEAL_SHARE.breakfast.label,
  },
  lunch: {
    meal: "lunch",
    label: "Lunch",
    emoji: "☀️",
    shareLabel: MEAL_SHARE.lunch.label,
  },
  dinner: {
    meal: "dinner",
    label: "Dinner",
    emoji: "🌙",
    shareLabel: MEAL_SHARE.dinner.label,
  },
};

const MEAL_FOOD_TEMPLATES: Record<MealSlot, FoodTemplate[]> = {
  breakfast: [
    {
      name: "Scrambled eggs",
      role: "protein",
      macros: { calories: 140, proteinG: 12, carbsG: 1, fatG: 10 },
      formatPortion: (s) => `${formatCount(2 * s)} large`,
    },
    {
      name: "Oatmeal",
      role: "carbs",
      macros: { calories: 150, proteinG: 5, carbsG: 27, fatG: 3 },
      formatPortion: (s) => `${formatVolume(0.5 * s)} cup cooked`,
    },
    {
      name: "Greek yogurt",
      role: "protein",
      macros: { calories: 130, proteinG: 18, carbsG: 8, fatG: 2 },
      formatPortion: (s) => `${formatVolume(0.75 * s)} cup`,
    },
    {
      name: "Blueberries",
      role: "produce",
      macros: { calories: 40, proteinG: 0, carbsG: 10, fatG: 0 },
      formatPortion: (s) => `${formatVolume(0.5 * s)} cup`,
    },
  ],
  lunch: [
    {
      name: "Grilled chicken",
      role: "protein",
      macros: { calories: 230, proteinG: 43, carbsG: 0, fatG: 5 },
      formatPortion: (s) => `${formatOz(5 * s)}`,
    },
    {
      name: "Brown rice",
      role: "carbs",
      macros: { calories: 220, proteinG: 5, carbsG: 45, fatG: 2 },
      formatPortion: (s) => `${formatVolume(s)} cup cooked`,
    },
    {
      name: "Mixed greens",
      role: "produce",
      macros: { calories: 80, proteinG: 2, carbsG: 4, fatG: 7 },
      formatPortion: (s) =>
        `${formatVolume(2 * s)} cups + ${formatVolume(1 / 48 * s, "tsp")} olive oil`,
    },
    {
      name: "Apple",
      role: "carbs",
      macros: { calories: 95, proteinG: 0, carbsG: 25, fatG: 0 },
      formatPortion: (s) => (s >= 1.4 ? `${formatCount(s)} medium` : "1 medium"),
    },
  ],
  dinner: [
    {
      name: "Salmon",
      role: "protein",
      macros: { calories: 280, proteinG: 39, carbsG: 0, fatG: 12 },
      formatPortion: (s) => `${formatOz(5 * s)}`,
    },
    {
      name: "Sweet potato",
      role: "carbs",
      macros: { calories: 180, proteinG: 4, carbsG: 41, fatG: 0 },
      formatPortion: (s) =>
        s >= 1.5 ? `${formatCount(s)} medium roasted` : "1 medium roasted",
    },
    {
      name: "Broccoli",
      role: "produce",
      macros: { calories: 55, proteinG: 4, carbsG: 11, fatG: 0 },
      formatPortion: (s) => `${formatVolume(1.5 * s)} cups`,
    },
    {
      name: "Avocado",
      role: "fat",
      macros: { calories: 80, proteinG: 1, carbsG: 4, fatG: 7 },
      formatPortion: (s) => `${formatVolume(0.25 * s)} fruit`,
    },
  ],
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
      proteinG: roundMacro(sum.proteinG + food.macros.proteinG),
      carbsG: roundMacro(sum.carbsG + food.macros.carbsG),
      fatG: roundMacro(sum.fatG + food.macros.fatG),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

function scaleTemplateFood(
  template: FoodTemplate,
  scale: number
): MealFoodExample {
  return {
    name: template.name,
    role: template.role,
    portion: template.formatPortion(scale),
    macros: scaleMacros(template.macros, scale),
  };
}

function buildScaledMealFoods(
  meal: MealSlot,
  targets: MacroTotals
): MealFoodExample[] {
  const templates = MEAL_FOOD_TEMPLATES[meal];
  const baseTotals = templates.reduce(
    (sum, item) => ({
      calories: sum.calories + item.macros.calories,
      proteinG: sum.proteinG + item.macros.proteinG,
      carbsG: sum.carbsG + item.macros.carbsG,
      fatG: sum.fatG + item.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const calorieScale =
    baseTotals.calories > 0 ? targets.calories / baseTotals.calories : 1;
  const clampedScale = clamp(calorieScale, 0.75, 2.5);

  const foods = templates.map((template) =>
    scaleTemplateFood(template, clampedScale)
  );

  topOffMacros(foods, targets, 8);

  return foods;
}

function topOffMacros(
  foods: MealFoodExample[],
  targets: MacroTotals,
  maxPasses: number
): void {
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const totals = sumPlateMacros(foods);
    const gaps = macroGaps(targets, totals);

    if (withinTolerance(targets, totals)) return;

    const macroKeys: (keyof MacroTotals)[] = [
      "proteinG",
      "carbsG",
      "fatG",
      "calories",
    ];
    const priority = [...macroKeys].sort(
      (a, b) => relativeGap(gaps[b], targets[b]) - relativeGap(gaps[a], targets[a])
    );

    const key = priority[0]!;
    if (gaps[key] <= 0) continue;

    if (key === "calories" || key === "proteinG") {
      foods.push(cloneTopOff("protein"));
      continue;
    }
    if (key === "carbsG") {
      foods.push(cloneTopOff("carbs"));
      continue;
    }
    foods.push(cloneTopOff("fat"));
  }

  trimExcessIfNeeded(foods, targets);
}

function trimExcessIfNeeded(
  foods: MealFoodExample[],
  targets: MacroTotals
): void {
  const totals = sumPlateMacros(foods);
  if (totals.calories <= targets.calories + 40) return;

  const removable = foods.findLast(
    (food) =>
      food.name === MACRO_TOP_OFFS.protein.name ||
      food.name === MACRO_TOP_OFFS.carbs.name ||
      food.name === MACRO_TOP_OFFS.fat.name
  );
  if (removable) {
    const index = foods.lastIndexOf(removable);
    if (index >= 0) foods.splice(index, 1);
  }
}

function cloneTopOff(kind: keyof typeof MACRO_TOP_OFFS): MealFoodExample {
  const source = MACRO_TOP_OFFS[kind];
  return {
    ...source,
    macros: { ...source.macros },
  };
}

function macroGaps(targets: MacroTotals, actual: MacroTotals): MacroTotals {
  return {
    calories: targets.calories - actual.calories,
    proteinG: roundMacro(targets.proteinG - actual.proteinG),
    carbsG: roundMacro(targets.carbsG - actual.carbsG),
    fatG: roundMacro(targets.fatG - actual.fatG),
  };
}

function withinTolerance(targets: MacroTotals, actual: MacroTotals): boolean {
  const gaps = macroGaps(targets, actual);
  return (
    Math.abs(gaps.calories) <= Math.max(25, targets.calories * 0.05) &&
    Math.abs(gaps.proteinG) <= Math.max(3, targets.proteinG * 0.08) &&
    Math.abs(gaps.carbsG) <= Math.max(5, targets.carbsG * 0.08) &&
    Math.abs(gaps.fatG) <= Math.max(3, targets.fatG * 0.1)
  );
}

function relativeGap(gap: number, target: number): number {
  if (target <= 0) return gap > 0 ? 1 : 0;
  return Math.max(0, gap) / target;
}

function scaleMacros(macros: MacroTotals, scale: number): MacroTotals {
  return {
    calories: Math.round(macros.calories * scale),
    proteinG: roundMacro(macros.proteinG * scale),
    carbsG: roundMacro(macros.carbsG * scale),
    fatG: roundMacro(macros.fatG * scale),
  };
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatCount(value: number): string {
  const rounded = Math.round(value * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatVolume(value: number, unit = "cup"): string {
  if (value < 0.125) return `⅛ ${unit}`;
  const fractions: [number, string][] = [
    [0.25, "¼"],
    [0.33, "⅓"],
    [0.5, "½"],
    [0.67, "⅔"],
    [0.75, "¾"],
    [1, "1"],
    [1.25, "1¼"],
    [1.33, "1⅓"],
    [1.5, "1½"],
    [1.67, "1⅔"],
    [1.75, "1¾"],
    [2, "2"],
    [2.5, "2½"],
    [3, "3"],
  ];

  let closest = fractions[0];
  for (const entry of fractions) {
    if (Math.abs(entry[0] - value) < Math.abs(closest[0] - value)) {
      closest = entry;
    }
  }
  return `${closest[1]} ${unit}`;
}

function formatOz(value: number): string {
  const rounded = Math.round(value * 2) / 2;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} oz`;
}

export function buildMealPlateExamples(
  targets: NutritionTargets | null
): MealPlateExample[] {
  if (!targets) return [];

  return (["breakfast", "lunch", "dinner"] as MealSlot[]).map((meal) => {
    const mealTargets = mealTargetsFromDaily(targets, meal);
    return {
      ...PLATE_TEMPLATES[meal],
      targets: mealTargets,
      foods: buildScaledMealFoods(meal, mealTargets),
    };
  });
}

export const FOOD_ROLE_COLORS: Record<MealFoodExample["role"], string> = {
  protein: "bg-forge-coral/20 border-forge-coral/40 text-forge-coral",
  carbs: "bg-forge-gold/20 border-forge-gold/40 text-forge-gold",
  produce: "bg-forge-success/15 border-forge-success/35 text-forge-success",
  fat: "bg-forge-steel/15 border-forge-steel/35 text-forge-steel",
};
