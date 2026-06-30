import { lookupOpenFoodFactsByBarcode, searchOpenFoodFacts } from "./open-food-facts";
import type { FoodSearchResult } from "./types";
import { searchUsdaFoods } from "./usda";

export { lookupOpenFoodFactsByBarcode } from "./open-food-facts";

export interface SearchFoodsOptions {
  usdaApiKey?: string;
  limitPerSource?: number;
  offOnly?: boolean;
}

export async function searchFoods(
  query: string,
  options: SearchFoodsOptions = {}
): Promise<FoodSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = options.limitPerSource ?? 10;
  const offOnly = options.offOnly === true;

  const [usda, off] = await Promise.all([
    !offOnly && options.usdaApiKey
      ? searchUsdaFoods(trimmed, options.usdaApiKey, limit)
      : Promise.resolve([]),
    searchOpenFoodFacts(trimmed, limit),
  ]);

  const seen = new Set<string>();
  const merged: FoodSearchResult[] = [];

  for (const item of [...usda, ...off]) {
    const key = `${item.source}:${item.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(0, limit * 2);
}
