"use client";

import type { FoodSearchResult } from "@forgefit/nutrition-core";
import type { DailyNutritionSummary, MacroQuickEntry } from "@/lib/nutrition/types";
import { SectionTabs } from "@/components/layout/section-tabs";
import { appSectionStack } from "@/components/layout/page-layout";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodSearchPanel } from "./food-search-panel";
import { LoggedEntries } from "./logged-entries";
import { MacroPresets } from "./macro-presets";
import { MealPlateExamples } from "./meal-plate-examples";
import { MacroSummary } from "./macro-summary";
import { QuickMacroLog } from "./quick-macro-log";
import { RestaurantSearchPanel } from "./restaurant-search-panel";

type DiaryTab = "log" | "browse" | "meals";

interface NutritionDiaryProps {
  initialSummary: DailyNutritionSummary;
  recentEntries: MacroQuickEntry[];
  yesterdayEntryCount: number;
  yesterdayDate: string;
  restaurantSearchUnlocked: boolean;
}

export function NutritionDiary({
  initialSummary,
  recentEntries,
  yesterdayEntryCount,
  yesterdayDate,
  restaurantSearchUnlocked,
}: NutritionDiaryProps) {
  const router = useRouter();
  const [tab, setTab] = useState<DiaryTab>("log");
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
      <SectionTabs
        ariaLabel="Nutrition sections"
        activeId={tab}
        onChange={(id) => setTab(id as DiaryTab)}
        tabs={[
          { id: "log", label: "Log" },
          { id: "browse", label: "Browse" },
          { id: "meals", label: "Meals" },
        ]}
      />

      {tab === "log" && (
        <div className="flex flex-col gap-4 sm:gap-5">
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              Today
            </h2>
            <div className="mt-4">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                variant="compact"
                embedded
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              Quick log
            </h2>
            <p className="mt-1 text-xs text-forge-muted">
              Name optional — calories + protein required
            </p>
            <div className="mt-4">
              <QuickMacroLog
                loggedDate={initialSummary.date}
                embedded
                onApplied={() => setPresetVersion((v) => v + 1)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              Presets
            </h2>
            <div className="mt-4">
              <MacroPresets
                key={presetVersion}
                loggedDate={initialSummary.date}
                recentEntries={recentEntries}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <LoggedEntries
              entries={initialSummary.entries}
              deletingId={deletingId}
              onDelete={(id) => void handleDelete(id)}
              embedded
            />
          </section>
        </div>
      )}

      {tab === "browse" && (
        <div className="flex flex-col gap-4 sm:gap-5">
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              Today
            </h2>
            <div className="mt-4">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                variant="compact"
                embedded
              />
            </div>
          </section>

          <RestaurantSearchPanel
            loggedDate={initialSummary.date}
            unlocked={restaurantSearchUnlocked}
            onSavedMeal={() => setPresetVersion((v) => v + 1)}
          />

          <FoodSearchPanel onAdd={handleFoodAdd} adding={adding} />

          {yesterdayEntryCount > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                Copy yesterday
              </h2>
              <button
                type="button"
                disabled={copying}
                onClick={() => void handleCopyYesterday()}
                className="mt-3 text-sm font-semibold text-forge-steel hover:text-forge-ember disabled:opacity-50"
              >
                {copying
                  ? "Copying…"
                  : `Copy ${yesterdayEntryCount} ${yesterdayEntryCount === 1 ? "entry" : "entries"} from yesterday`}
              </button>
              {copyError && (
                <p className="mt-2 text-sm text-forge-coral">{copyError}</p>
              )}
            </section>
          )}
        </div>
      )}

      {tab === "meals" && (
        <div className="flex flex-col gap-4 sm:gap-5">
          <MealPlateExamples targets={initialSummary.targets} />
        </div>
      )}
    </div>
  );
}
