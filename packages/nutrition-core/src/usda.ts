import type { FoodMacrosPer100g, FoodSearchResult } from "./types";

const USDA_NUTRIENT = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
} as const;

interface UsdaFoodNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
}

interface UsdaSearchFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaSearchFood[];
}

function nutrientValue(
  nutrients: UsdaFoodNutrient[] | undefined,
  id: number
): number {
  if (!nutrients?.length) return 0;
  const row = nutrients.find(
    (n) => n.nutrientId === id || n.nutrientNumber === String(id)
  );
  return row?.value ?? 0;
}

function macrosFromUsdaFood(food: UsdaSearchFood): FoodMacrosPer100g {
  return {
    calories: Math.round(nutrientValue(food.foodNutrients, USDA_NUTRIENT.calories)),
    proteinG: round1(nutrientValue(food.foodNutrients, USDA_NUTRIENT.protein)),
    fatG: round1(nutrientValue(food.foodNutrients, USDA_NUTRIENT.fat)),
    carbsG: round1(nutrientValue(food.foodNutrients, USDA_NUTRIENT.carbs)),
  };
}

function servingLabel(food: UsdaSearchFood): string {
  if (food.servingSize && food.servingSizeUnit) {
    return `${food.servingSize} ${food.servingSizeUnit}`;
  }
  return "100 g";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function searchUsdaFoods(
  query: string,
  apiKey: string,
  limit = 12
): Promise<FoodSearchResult[]> {
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS),Branded");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];

    const data = (await response.json()) as UsdaSearchResponse;
    return (data.foods ?? [])
      .filter((food) => food.description?.trim())
      .map((food) => ({
        id: String(food.fdcId),
        source: "usda" as const,
        name: food.description.trim(),
        brand: food.brandOwner ?? food.brandName,
        servingDescription: servingLabel(food),
        per100g: macrosFromUsdaFood(food),
      }))
      .filter((food) => food.per100g.calories > 0 || food.per100g.proteinG > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
