import type { WholeFood } from "@forgefit/nutrition-core";

export interface CustomFood {
  id: string;
  name: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
}

export interface CustomFoodInput {
  name: string;
  servingLabel?: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
}

const CUSTOM_FOODS_KEY = "forgefit:custom-foods";
const MAX_CUSTOM_FOODS = 64;
export const CUSTOM_FOOD_ID_PREFIX = "custom:";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCustomFood(raw: Partial<CustomFood>): CustomFood | null {
  if (typeof raw?.name !== "string" || !raw.name.trim()) return null;
  if (!Number.isFinite(raw.calories) || !Number.isFinite(raw.proteinG)) return null;

  return {
    id: raw.id ?? createCustomFoodId(),
    name: raw.name.trim(),
    servingLabel: raw.servingLabel?.trim() || "1 serving",
    calories: Number(raw.calories),
    proteinG: Number(raw.proteinG),
    carbsG: Number(raw.carbsG ?? 0),
    fatG: Number(raw.fatG ?? 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function createCustomFoodId(): string {
  return `${CUSTOM_FOOD_ID_PREFIX}${crypto.randomUUID()}`;
}

export function isCustomFoodId(foodId: string): boolean {
  return foodId.startsWith(CUSTOM_FOOD_ID_PREFIX);
}

export function loadCustomFoods(): CustomFood[] {
  const raw = readJson<CustomFood[]>(CUSTOM_FOODS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeCustomFood(item))
    .filter((item): item is CustomFood => item != null);
}

export function saveCustomFoods(foods: CustomFood[]): void {
  writeJson(CUSTOM_FOODS_KEY, foods.slice(0, MAX_CUSTOM_FOODS));
}

export function saveCustomFood(input: CustomFoodInput): CustomFood {
  const food = normalizeCustomFood({
    id: createCustomFoodId(),
    name: input.name,
    servingLabel: input.servingLabel,
    calories: input.calories,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    createdAt: new Date().toISOString(),
  });

  if (!food) {
    throw new Error("Enter a name and valid macros.");
  }

  const foods = [food, ...loadCustomFoods()].slice(0, MAX_CUSTOM_FOODS);
  saveCustomFoods(foods);
  return food;
}

export function removeCustomFood(id: string): void {
  saveCustomFoods(loadCustomFoods().filter((food) => food.id !== id));
}

export function searchCustomFoods(query: string): CustomFood[] {
  const normalized = query.trim().toLowerCase();
  const foods = loadCustomFoods();
  if (!normalized) return foods;
  return foods.filter((food) => food.name.toLowerCase().includes(normalized));
}

export function customFoodToWholeFood(food: CustomFood): WholeFood {
  return {
    id: food.id,
    name: food.name,
    group: "pantry",
    servingLabel: food.servingLabel,
    macros: {
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
    },
    searchTerms: ["custom food", "my food"],
  };
}
