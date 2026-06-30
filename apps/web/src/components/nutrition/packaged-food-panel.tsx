"use client";

import { MealTypePicker } from "@/components/nutrition/meal-type-picker";
import { FoodSearch } from "@/components/nutrition/food-search";
import { postFoodSearchLogEntry } from "@/lib/nutrition/log-entry";
import {
  getPreferredMealType,
  type MealType,
} from "@/lib/nutrition/meal-types";
import type { FoodSearchResult } from "@forgefit/nutrition-core";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PackagedFoodPanelProps {
  loggedDate: string;
}

export function PackagedFoodPanel({ loggedDate }: PackagedFoodPanelProps) {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>(() =>
    getPreferredMealType()
  );
  const [barcode, setBarcode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logFood(food: FoodSearchResult) {
    setLogging(true);
    setError(null);
    try {
      await postFoodSearchLogEntry({
        loggedDate,
        mealType,
        food,
        quantity: 1,
        servingGrams: 100,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log food.");
    } finally {
      setLogging(false);
    }
  }

  async function handleBarcodeLookup(event: React.FormEvent) {
    event.preventDefault();
    const code = barcode.trim();
    if (!code) return;

    setLookingUp(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/nutrition/barcode?code=${encodeURIComponent(code)}`
      );
      const body = (await response.json()) as {
        error?: string;
        food?: FoodSearchResult;
      };
      if (!response.ok || !body.food) {
        throw new Error(body.error ?? "Product not found.");
      }
      await logFood(body.food);
      setBarcode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Packaged food
      </h2>
      <p className="mt-1 text-sm text-forge-muted">
        Scan or enter a barcode for yogurt, protein bars, and other packaged
        staples — powered by Open Food Facts.
      </p>

      <div className="mt-4">
        <MealTypePicker value={mealType} onChange={setMealType} compact />
      </div>

      <form onSubmit={(event) => void handleBarcodeLookup(event)} className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-forge-muted">
          Barcode
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            inputMode="numeric"
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            placeholder="UPC / EAN"
            className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-base text-forge-text outline-none focus:border-forge-ember"
          />
          <button
            type="submit"
            disabled={lookingUp || logging || !barcode.trim()}
            className="min-h-[48px] shrink-0 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {lookingUp ? "Looking…" : "Log"}
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-[var(--border)] pt-5">
        <FoodSearch
          embedded
          offOnly
          adding={logging}
          onAdd={async (food) => logFood(food)}
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
