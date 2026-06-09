"use client";

import type { FoodSearchResult } from "@forgefit/nutrition-core";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodSearch } from "./food-search";
import { MacroSummary } from "./macro-summary";

interface NutritionDiaryProps {
  initialSummary: DailyNutritionSummary;
}

export function NutritionDiary({ initialSummary }: NutritionDiaryProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(
    food: FoodSearchResult,
    quantity: number,
    servingGrams: number
  ) {
    setAdding(true);
    try {
      const response = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: crypto.randomUUID(),
          loggedDate: initialSummary.date,
          foodName: food.name,
          foodSource: food.source,
          externalFoodId: food.id,
          brand: food.brand,
          servingDescription: food.servingDescription,
          quantity,
          servingGrams,
          per100g: food.per100g,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Could not log food");
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not log food."
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/nutrition/logs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Could not remove entry");
      }
      router.refresh();
    } catch {
      window.alert("Could not remove that entry. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <MacroSummary
        totals={initialSummary.totals}
        targets={initialSummary.targets}
      />

      <FoodSearch onAdd={handleAdd} adding={adding} />

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Logged today
        </h2>
        {initialSummary.entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-forge-muted">
              Search and tap a food to start your diary.
            </p>
          </div>
        ) : (
          initialSummary.entries.map((entry) => (
            <article
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
            >
              <div className="min-w-0">
                <p className="font-display font-semibold text-forge-text">
                  {entry.foodName}
                </p>
                <p className="mt-1 text-sm text-forge-muted">
                  {entry.quantity}× {entry.servingDescription}
                  {entry.brand ? ` · ${entry.brand}` : ""}
                </p>
                <p className="mt-1 text-sm text-forge-steel">
                  {Math.round(entry.calories)} kcal · P {entry.proteinG}g · C{" "}
                  {entry.carbsG}g · F {entry.fatG}g
                </p>
              </div>
              <button
                type="button"
                disabled={deletingId === entry.id}
                onClick={() => void handleDelete(entry.id)}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-forge-coral disabled:opacity-50"
              >
                {deletingId === entry.id ? "…" : "Remove"}
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
