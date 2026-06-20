import {
  createSavedMealId,
  loadSavedMeals,
  removeSavedMeal,
  saveSavedMeal,
  type SavedMeal,
} from "./saved-meals";

/** @deprecated Use SavedMeal from saved-meals.ts */
export type MacroPreset = SavedMeal;

export const BUILTIN_MACRO_PRESETS: Array<
  Pick<SavedMeal, "id" | "name" | "calories" | "proteinG" | "carbsG" | "fatG">
> = [
  {
    id: "protein-shake",
    name: "Protein shake",
    calories: 120,
    proteinG: 30,
    carbsG: 3,
    fatG: 1,
  },
  {
    id: "greek-yogurt",
    name: "Greek yogurt",
    calories: 150,
    proteinG: 20,
    carbsG: 8,
    fatG: 2,
  },
  {
    id: "post-workout",
    name: "Post-workout",
    calories: 250,
    proteinG: 25,
    carbsG: 30,
    fatG: 3,
  },
  {
    id: "standard-lunch",
    name: "Standard lunch",
    calories: 550,
    proteinG: 40,
    carbsG: 45,
    fatG: 18,
  },
];

export function loadSavedMacroPresets(): SavedMeal[] {
  return loadSavedMeals();
}

export function saveMacroPreset(preset: SavedMeal): void {
  saveSavedMeal(preset);
}

export function removeMacroPreset(id: string): void {
  removeSavedMeal(id);
}

export function createPresetId(): string {
  return createSavedMealId();
}
