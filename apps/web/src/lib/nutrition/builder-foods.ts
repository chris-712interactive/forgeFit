import {
  searchWholeFoods,
  type WholeFood,
  type WholeFoodGroup,
} from "@forgefit/nutrition-core";
import {
  customFoodToWholeFood,
  searchCustomFoods,
} from "./custom-foods";

export type BuilderFoodFilter = WholeFoodGroup | "all" | "custom";

export function searchBuilderFoods(
  query: string,
  filter: BuilderFoodFilter = "all"
): WholeFood[] {
  const normalized = query.trim();

  if (filter === "custom") {
    return searchCustomFoods(normalized).map(customFoodToWholeFood).slice(0, 24);
  }

  const customFoods = searchCustomFoods(normalized).map(customFoodToWholeFood);
  const wholeFoods = searchWholeFoods(
    normalized,
    filter === "all" ? undefined : filter
  );

  if (!normalized && filter === "all") {
    return [...customFoods.slice(0, 8), ...wholeFoods.slice(0, 16)];
  }

  return [...customFoods, ...wholeFoods].slice(0, 24);
}
