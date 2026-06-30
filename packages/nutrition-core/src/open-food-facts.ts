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

interface OffProductResponse {
  status?: number;
  product?: OffProduct;
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

function mapOffProduct(product: OffProduct): FoodSearchResult | null {
  if (!product.product_name?.trim()) return null;
  const per100g = macrosFromOff(product);
  if (per100g.calories <= 0 && per100g.proteinG <= 0) return null;

  return {
    id: product.code ?? product.product_name,
    source: "off",
    name: product.product_name.trim(),
    brand: product.brands?.split(",")[0]?.trim(),
    servingDescription: product.serving_size?.trim() || "100 g",
    per100g,
  };
}

const OFF_HEADERS = {
  "User-Agent": "ForgeRep/1.0 (nutrition diary)",
} as const;

export async function lookupOpenFoodFactsByBarcode(
  barcode: string
): Promise<FoodSearchResult | null> {
  const normalized = barcode.replace(/\D/g, "");
  if (normalized.length < 8 || normalized.length > 14) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${normalized}.json`,
      { signal: controller.signal, headers: OFF_HEADERS }
    );
    if (!response.ok) return null;

    const data = (await response.json()) as OffProductResponse;
    if (data.status !== 1 || !data.product) return null;
    return mapOffProduct({ ...data.product, code: normalized });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
      headers: OFF_HEADERS,
    });
    if (!response.ok) return [];

    const data = (await response.json()) as OffSearchResponse;
    return (data.products ?? [])
      .map((product) => mapOffProduct(product))
      .filter((food): food is FoodSearchResult => food != null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
