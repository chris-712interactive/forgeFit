import type { MacroQuickEntry } from "./types";

const FAVORITES_KEY = "forgefit:nutrition-favorites";
const MAX_FAVORITES = 12;

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

export function favoriteEntryKey(entry: MacroQuickEntry): string {
  return [
    entry.foodName.trim().toLowerCase(),
    entry.calories,
    entry.proteinG,
    entry.carbsG,
    entry.fatG,
  ].join("|");
}

export function loadNutritionFavorites(): MacroQuickEntry[] {
  const raw = readJson<MacroQuickEntry[]>(FAVORITES_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) =>
      typeof entry?.foodName === "string" &&
      Number.isFinite(entry.calories) &&
      Number.isFinite(entry.proteinG)
  );
}

export function saveNutritionFavorites(favorites: MacroQuickEntry[]): void {
  writeJson(FAVORITES_KEY, favorites.slice(0, MAX_FAVORITES));
}

export function isNutritionFavorite(
  entry: MacroQuickEntry,
  favorites: MacroQuickEntry[]
): boolean {
  const key = favoriteEntryKey(entry);
  return favorites.some((item) => favoriteEntryKey(item) === key);
}

export function toggleNutritionFavorite(entry: MacroQuickEntry): MacroQuickEntry[] {
  const favorites = loadNutritionFavorites();
  const key = favoriteEntryKey(entry);
  const existing = favorites.findIndex((item) => favoriteEntryKey(item) === key);

  if (existing >= 0) {
    const next = [...favorites];
    next.splice(existing, 1);
    saveNutritionFavorites(next);
    return next;
  }

  const next = [entry, ...favorites].slice(0, MAX_FAVORITES);
  saveNutritionFavorites(next);
  return next;
}
