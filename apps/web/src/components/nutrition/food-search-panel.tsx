"use client";

import type { FoodSearchResult } from "@forgefit/nutrition-core";
import { FoodSearch } from "./food-search";

interface FoodSearchPanelProps {
  onAdd: (food: FoodSearchResult, quantity: number, servingGrams: number) => Promise<void>;
  adding: boolean;
}

export function FoodSearchPanel({ onAdd, adding }: FoodSearchPanelProps) {
  return (
    <details className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised">
      <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 sm:py-5 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-forge-text">
              Search food database
            </p>
            <p className="mt-1 text-xs text-forge-muted">
              USDA & Open Food Facts — optional, for specific ingredients
            </p>
          </div>
          <span className="text-sm font-semibold text-forge-steel">Expand</span>
        </div>
      </summary>
      <div className="border-t border-[var(--border)] px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        <FoodSearch onAdd={onAdd} adding={adding} embedded />
      </div>
    </details>
  );
}
