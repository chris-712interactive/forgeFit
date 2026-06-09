export type FoodSource = "usda" | "off" | "custom";

export interface MacroTotals {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface FoodMacrosPer100g extends MacroTotals {}

export interface FoodSearchResult {
  id: string;
  source: Exclude<FoodSource, "custom">;
  name: string;
  brand?: string;
  servingDescription: string;
  per100g: FoodMacrosPer100g;
}

export interface NutritionLogInput {
  clientId: string;
  loggedDate: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  foodSource: FoodSource;
  externalFoodId?: string;
  brand?: string;
  servingDescription: string;
  quantity: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}
