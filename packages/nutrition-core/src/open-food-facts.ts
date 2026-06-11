import type { FoodMacrosPer100g, FoodSearchResult } from "./types";

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
  };
}

interface OffSearchResponse {
  products?: OffProduct[];
}

function macrosFromOff(product: OffProduct): FoodMacrosPer100g {
  const n = product.nutriments ?? {};
  return {
    calories: Math.round(n["energy-kcal_100g"] ?? 0),
    proteinG: round1(n.proteins_100g ?? 0),
    fatG: round1(n.fat_100g ?? 0),
    carbsG: round1(n.carbohydrates_100g ?? 0),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function searchOpenFoodFacts(
  query: string,
  limit = 12
): Promise<FoodSearchResult[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("fields", "code,product_name,brands,serving_size,nutriments");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ForgeFit/1.0 (nutrition diary)" },
    });
    if (!response.ok) return [];

    const data = (await response.json()) as OffSearchResponse;
    return (data.products ?? [])
      .filter((product) => product.product_name?.trim())
      .map((product) => ({
        id: product.code ?? product.product_name!,
        source: "off" as const,
        name: product.product_name!.trim(),
        brand: product.brands?.split(",")[0]?.trim(),
        servingDescription: product.serving_size?.trim() || "100 g",
        per100g: macrosFromOff(product),
      }))
      .filter((food) => food.per100g.calories > 0 || food.per100g.proteinG > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
