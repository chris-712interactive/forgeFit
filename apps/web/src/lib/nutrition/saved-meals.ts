export interface SavedMealCategory {
  id: string;
  name: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  categoryId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
}

export type SavedMealInput = Omit<SavedMeal, "id" | "createdAt"> & {
  id?: string;
};

export const UNCATEGORIZED_CATEGORY_ID = "uncategorized";

export const DEFAULT_CATEGORIES: SavedMealCategory[] = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
  { id: "snacks", name: "Snacks" },
  { id: "favorites", name: "Favorites" },
];

const MEALS_KEY = "forgefit:saved-meals";
const CATEGORIES_KEY = "forgefit:saved-meal-categories";
const LEGACY_PRESETS_KEY = "forgefit:macro-presets";

const CATEGORY_COLORS = [
  "text-forge-gold",
  "text-forge-ember",
  "text-forge-coral",
  "text-forge-steel",
  "text-forge-success",
] as const;

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

function migrateLegacyPresets(): SavedMeal[] {
  const legacy = readJson<
    Array<{
      id: string;
      name: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    }>
  >(LEGACY_PRESETS_KEY);

  if (!legacy?.length) return [];

  const migrated = legacy.map((item) => ({
    id: item.id.startsWith("saved-") ? item.id : `saved-${item.id}`,
    name: item.name,
    categoryId: "favorites",
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    createdAt: new Date().toISOString(),
  }));

  writeJson(MEALS_KEY, migrated);
  localStorage.removeItem(LEGACY_PRESETS_KEY);
  return migrated;
}

export function loadSavedMealCategories(): SavedMealCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;

  const stored = readJson<SavedMealCategory[]>(CATEGORIES_KEY);
  if (!stored?.length) {
    writeJson(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return stored;
}

export function saveSavedMealCategory(category: SavedMealCategory): void {
  const existing = loadSavedMealCategories();
  const withoutDup = existing.filter((item) => item.id !== category.id);
  writeJson(CATEGORIES_KEY, [...withoutDup, category]);
}

export function createCategoryId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `cat-${slug || "custom"}-${crypto.randomUUID().slice(0, 8)}`;
}

export function removeSavedMealCategory(id: string): void {
  if (DEFAULT_CATEGORIES.some((category) => category.id === id)) return;

  const categories = loadSavedMealCategories().filter((item) => item.id !== id);
  writeJson(CATEGORIES_KEY, categories);

  const meals = loadSavedMeals().map((meal) =>
    meal.categoryId === id
      ? { ...meal, categoryId: UNCATEGORIZED_CATEGORY_ID }
      : meal
  );
  writeJson(MEALS_KEY, meals);
}

export function renameSavedMealCategory(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;

  const categories = loadSavedMealCategories().map((category) =>
    category.id === id ? { ...category, name: trimmed } : category
  );
  writeJson(CATEGORIES_KEY, categories);
}

export function loadSavedMeals(): SavedMeal[] {
  if (typeof window === "undefined") return [];

  let meals = readJson<SavedMeal[]>(MEALS_KEY);
  if (!meals) {
    meals = migrateLegacyPresets();
  }
  return Array.isArray(meals) ? meals : [];
}

export function saveSavedMeal(input: SavedMealInput): SavedMeal {
  const existing = loadSavedMeals();
  const meal: SavedMeal = {
    id: input.id ?? createSavedMealId(),
    name: input.name.trim(),
    categoryId: input.categoryId,
    calories: input.calories,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    createdAt:
      existing.find((item) => item.id === input.id)?.createdAt ??
      new Date().toISOString(),
  };

  const withoutDup = existing.filter((item) => item.id !== meal.id);
  writeJson(MEALS_KEY, [meal, ...withoutDup].slice(0, 48));
  return meal;
}

export function removeSavedMeal(id: string): void {
  writeJson(
    MEALS_KEY,
    loadSavedMeals().filter((item) => item.id !== id)
  );
}

export function createSavedMealId(): string {
  return `saved-${crypto.randomUUID()}`;
}

export function getCategoryById(
  categoryId: string,
  categories = loadSavedMealCategories()
): SavedMealCategory | null {
  if (categoryId === UNCATEGORIZED_CATEGORY_ID) {
    return { id: UNCATEGORIZED_CATEGORY_ID, name: "Other" };
  }
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function getCategoryColor(categoryId: string, categories: SavedMealCategory[]): string {
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index < 0) return CATEGORY_COLORS[0];
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export function formatMacroLine(meal: Pick<
  SavedMeal,
  "calories" | "proteinG" | "carbsG" | "fatG"
>): string {
  const parts = [
    `${Math.round(meal.calories)} kcal`,
    `${meal.proteinG}g P`,
  ];
  if (meal.carbsG > 0) parts.push(`${meal.carbsG}g C`);
  if (meal.fatG > 0) parts.push(`${meal.fatG}g F`);
  return parts.join(" · ");
}

export function mealFromMacros(input: {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  categoryId?: string;
}): SavedMealInput {
  return {
    name: input.name,
    categoryId: input.categoryId ?? "favorites",
    calories: input.calories,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
  };
}
