"use client";

import type { FoodSearchResult } from "@forgefit/nutrition-core";
import { appSectionStack } from "@/components/layout/page-layout";
import type { DailyNutritionSummary, MacroQuickEntry } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodSearchPanel } from "./food-search-panel";
import { LoggedEntries } from "./logged-entries";
import { MacroPresets } from "./macro-presets";
import { MacroSummary } from "./macro-summary";
import { QuickMacroLog } from "./quick-macro-log";

interface NutritionDiaryProps {
  initialSummary: DailyNutritionSummary;
  recentEntries: MacroQuickEntry[];
  yesterdayEntryCount: number;
  yesterdayDate: string;
}

export function NutritionDiary({
  initialSummary,
  recentEntries,
  yesterdayEntryCount,
  yesterdayDate,
}: NutritionDiaryProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [presetVersion, setPresetVersion] = useState(0);

  async function handleFoodAdd(
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

  async function handleCopyYesterday() {
    setCopying(true);
    setCopyError(null);
    try {
      const response = await fetch("/api/nutrition/copy-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDate: yesterdayDate,
          targetDate: initialSummary.date,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Could not copy yesterday");
      }

      router.refresh();
    } catch (error) {
      setCopyError(
        error instanceof Error ? error.message : "Could not copy yesterday."
      );
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className={appSectionStack}>
      <MacroSummary
        totals={initialSummary.totals}
        targets={initialSummary.targets}
      />

      <QuickMacroLog
        loggedDate={initialSummary.date}
        onApplied={() => setPresetVersion((v) => v + 1)}
      />

      <MacroPresets
        key={presetVersion}
        loggedDate={initialSummary.date}
        recentEntries={recentEntries}
      />

      {yesterdayEntryCount > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={copying}
            onClick={() => void handleCopyYesterday()}
            className="text-sm font-semibold text-forge-steel hover:text-forge-ember disabled:opacity-50"
          >
            {copying
              ? "Copying…"
              : `Copy yesterday (${yesterdayEntryCount} ${yesterdayEntryCount === 1 ? "entry" : "entries"})`}
          </button>
          {copyError && (
            <p className="mt-2 text-sm text-forge-coral">{copyError}</p>
          )}
        </div>
      )}

      <LoggedEntries
        entries={initialSummary.entries}
        deletingId={deletingId}
        onDelete={(id) => void handleDelete(id)}
      />

      <FoodSearchPanel onAdd={handleFoodAdd} adding={adding} />
    </div>
  );
}
