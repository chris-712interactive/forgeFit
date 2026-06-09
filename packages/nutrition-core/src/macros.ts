import type { FoodMacrosPer100g, MacroTotals } from "./types";

export function scaleMacrosFrom100g(
  per100g: FoodMacrosPer100g,
  grams: number
): MacroTotals {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    proteinG: round1(per100g.proteinG * factor),
    fatG: round1(per100g.fatG * factor),
    carbsG: round1(per100g.carbsG * factor),
  };
}

export function sumMacros(entries: MacroTotals[]): MacroTotals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      proteinG: round1(acc.proteinG + entry.proteinG),
      fatG: round1(acc.fatG + entry.fatG),
      carbsG: round1(acc.carbsG + entry.carbsG),
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
