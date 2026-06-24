"use client";

import { browserTodayIsoDate } from "@/lib/datetime/local-date";
import type { DailyNutritionSummary, MacroQuickEntry } from "@/lib/nutrition/types";
import { SectionTabs } from "@/components/layout/section-tabs";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { appSectionStack } from "@/components/layout/page-layout";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoggedEntries } from "./logged-entries";
import { MacroPresets } from "./macro-presets";
import { MealPlateExamples } from "./meal-plate-examples";
import { MacroSummary } from "./macro-summary";
import { QuickMacroLog } from "./quick-macro-log";
import { RestaurantSearchPanel } from "./restaurant-search-panel";
import { SavedMealsLibrary } from "./saved-meals-library";
import { SavedMealsQuickLog } from "./saved-meals-quick-log";
import { SaveMealSheet, type SaveMealDraft } from "./save-meal-sheet";

type DiaryTab = "log" | "browse" | "my-meals";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [mealsVersion, setMealsVersion] = useState(0);
  const [formPrefill, setFormPrefill] = useState<SaveMealDraft | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [saveDraft, setSaveDraft] = useState<SaveMealDraft | null>(null);
  const [openBuilder, setOpenBuilder] = useState(false);

  function bumpMealsVersion() {
    setMealsVersion((v) => v + 1);
  }

  function openSaveSheet(draft: SaveMealDraft) {
    setSaveDraft(draft);
  }

  function handleEditPreset(draft: SaveMealDraft) {
    setFormPrefill(draft);
    setFormKey((k) => k + 1);
    setTab("log");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <>
      <div className={appSectionStack}>
        <SectionTabs
          ariaLabel="Nutrition sections"
          activeId={tab}
          onChange={(id) => setTab(id as DiaryTab)}
          tabs={[
            { id: "log", label: "Log" },
            { id: "browse", label: "Browse" },
            { id: "my-meals", label: "My Meals" },
          ]}
        />

        {tab === "log" && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <section className="rounded-2xl border border-forge-ember/25 bg-forge-surface-raised p-4 sm:p-5">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                variant="compact"
                embedded
              />
              <div className="mt-5 border-t border-[var(--border)] pt-5">
                <QuickMacroLog
                  key={formKey}
                  loggedDate={initialSummary.date}
                  totals={initialSummary.totals}
                  targets={initialSummary.targets}
                  initialValues={formPrefill}
                  onSaveMeal={openSaveSheet}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                    Build from ingredients
                  </h2>
                  <p className="mt-1 text-xs text-forge-muted">
                    Pick whole foods — eggs, chicken, rice — and save as a reusable meal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTab("my-meals");
                    setOpenBuilder(true);
                  }}
                  className="shrink-0 rounded-xl bg-forge-ember/10 px-3 py-2 text-sm font-semibold text-forge-ember hover:bg-forge-ember/20"
                >
                  Build meal
                </button>
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

            <SavedMealsQuickLog
              loggedDate={initialSummary.date}
              refreshKey={mealsVersion}
            />

            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                Quick add
              </h2>
              <p className="mt-1 text-xs text-forge-muted">
                Log common or recent items — bookmark recent meals to My Meals
              </p>
              <div className="mt-4">
                <MacroPresets
                  key={mealsVersion}
                  loggedDate={initialSummary.date}
                  recentEntries={recentEntries}
                  refreshKey={mealsVersion}
                  onEditPreset={handleEditPreset}
                  onSaveMeal={openSaveSheet}
                  onOpenMyMeals={() => setTab("my-meals")}
                />
              </div>
            </section>
          </div>
        )}

        {tab === "browse" && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                variant="compact"
                embedded
              />
            </section>

            <RestaurantSearchPanel
              loggedDate={initialSummary.date}
              unlocked={restaurantSearchUnlocked}
              onSaveMeal={openSaveSheet}
            />

            <CollapsibleSection title="Example plates" hint="Scaled to your targets">
              <MealPlateExamples
                targets={initialSummary.targets}
                embedded
              />
            </CollapsibleSection>

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

        {tab === "my-meals" && (
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <SavedMealsLibrary
              loggedDate={initialSummary.date}
              refreshKey={mealsVersion}
              onMealsChanged={bumpMealsVersion}
              openBuilder={openBuilder}
              onBuilderClose={() => setOpenBuilder(false)}
            />
          </section>
        )}
      </div>

      <SaveMealSheet
        open={saveDraft != null}
        draft={saveDraft}
        onClose={() => setSaveDraft(null)}
        onSaved={() => {
          bumpMealsVersion();
          setSaveDraft(null);
        }}
      />
    </>
  );
}
