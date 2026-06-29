"use client";

import type { TdeeDashboard } from "@/lib/nutrition/tdee-service";
import { formatNutritionDayShort } from "@/lib/nutrition/date-param";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import { SectionTabs } from "@/components/layout/section-tabs";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { appSectionStack } from "@/components/layout/page-layout";
import { NutritionDatePicker } from "@/components/nutrition/nutrition-date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoggedEntries } from "./logged-entries";
import { MealPlateExamples } from "./meal-plate-examples";
import { MacroSummary } from "./macro-summary";
import { RestaurantSearchPanel } from "./restaurant-search-panel";
import { SavedMealsLibrary } from "./saved-meals-library";
import { SaveMealSheet, type SaveMealDraft } from "./save-meal-sheet";
import { TdeeEnergyPanel } from "./tdee-energy-panel";

type DiaryTab = "diary" | "browse" | "my-meals";

const VALID_TABS = new Set<DiaryTab>(["diary", "browse", "my-meals"]);

function parseTab(value: string | null): DiaryTab {
  if (value === "today") return "diary";
  if (value && VALID_TABS.has(value as DiaryTab)) {
    return value as DiaryTab;
  }
  return "diary";
}

interface NutritionDiaryProps {
  initialSummary: DailyNutritionSummary;
  selectedDate: string;
  todayIso: string;
  yesterdayIso: string;
  isViewingToday: boolean;
  previousDayDate: string;
  previousDayEntryCount: number;
  yesterdayEntryCount: number;
  yesterdayDate: string;
  restaurantSearchUnlocked: boolean;
  tdeeDashboard: TdeeDashboard | null;
}

export function NutritionDiary({
  initialSummary,
  selectedDate,
  todayIso,
  yesterdayIso,
  isViewingToday,
  previousDayDate,
  previousDayEntryCount,
  yesterdayEntryCount,
  yesterdayDate,
  restaurantSearchUnlocked,
  tdeeDashboard,
}: NutritionDiaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<DiaryTab>(() =>
    parseTab(searchParams.get("tab"))
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [mealsVersion, setMealsVersion] = useState(0);
  const [saveDraft, setSaveDraft] = useState<SaveMealDraft | null>(null);

  const entryCount = initialSummary.entries.length;
  const copySourceDate = isViewingToday ? yesterdayDate : previousDayDate;
  const copySourceCount = isViewingToday
    ? yesterdayEntryCount
    : previousDayEntryCount;

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  function handleTabChange(nextTab: DiaryTab) {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "diary") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const query = params.toString();
    router.replace(query ? `/nutrition?${query}` : "/nutrition", {
      scroll: false,
    });
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

  async function handleCopyFromPreviousDay() {
    setCopying(true);
    setCopyError(null);
    try {
      const response = await fetch("/api/nutrition/copy-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDate: copySourceDate,
          targetDate: initialSummary.date,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Could not copy entries");
      }

      router.refresh();
    } catch (error) {
      setCopyError(
        error instanceof Error ? error.message : "Could not copy entries."
      );
    } finally {
      setCopying(false);
    }
  }

  return (
    <>
      <div className={appSectionStack}>
        <NutritionDatePicker
          selectedDate={selectedDate}
          todayIso={todayIso}
          yesterdayIso={yesterdayIso}
          entryCount={entryCount}
        />

        <SectionTabs
          ariaLabel="Nutrition sections"
          activeId={tab}
          onChange={(id) => handleTabChange(id as DiaryTab)}
          tabs={[
            { id: "diary", label: isViewingToday ? "Today" : "Diary" },
            { id: "browse", label: "Browse" },
            { id: "my-meals", label: "My Meals" },
          ]}
        />

        {tab === "diary" && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <section className="rounded-2xl border border-forge-ember/25 bg-forge-surface-raised p-4 sm:p-5">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                goal={tdeeDashboard?.nutritionContext?.goal ?? null}
                variant="compact"
                embedded
                showTargetDetails={false}
              />
            </section>

            {tdeeDashboard && isViewingToday && (
              <TdeeEnergyPanel dashboard={tdeeDashboard} />
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <LoggedEntries
                entries={initialSummary.entries}
                deletingId={deletingId}
                onDelete={(id) => void handleDelete(id)}
                embedded
                title={isViewingToday ? "Logged today" : "Logged this day"}
                emptyMessage={
                  isViewingToday
                    ? undefined
                    : `Nothing logged for ${formatNutritionDayShort(selectedDate)} yet. Tap + to backfill.`
                }
              />
            </section>
          </div>
        )}

        {tab === "browse" && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                goal={tdeeDashboard?.nutritionContext?.goal ?? null}
                variant="compact"
                embedded
              />
            </section>

            <RestaurantSearchPanel
              loggedDate={initialSummary.date}
              unlocked={restaurantSearchUnlocked}
              onSaveMeal={setSaveDraft}
            />

            <CollapsibleSection title="Example plates" hint="Scaled to your targets">
              <MealPlateExamples targets={initialSummary.targets} embedded />
            </CollapsibleSection>

            {copySourceCount > 0 && (
              <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                  {isViewingToday ? "Copy yesterday" : "Copy previous day"}
                </h2>
                <p className="mt-1 text-sm text-forge-muted">
                  {isViewingToday
                    ? "Duplicate everything you logged yesterday onto today."
                    : `Fill ${formatNutritionDayShort(selectedDate)} from ${formatNutritionDayShort(copySourceDate)}.`}
                </p>
                <button
                  type="button"
                  disabled={copying}
                  onClick={() => void handleCopyFromPreviousDay()}
                  className="mt-3 rounded-xl bg-forge-surface px-4 py-2.5 text-sm font-semibold text-forge-steel ring-1 ring-[var(--border)] transition-colors hover:text-forge-ember disabled:opacity-50"
                >
                  {copying
                    ? "Copying…"
                    : `Copy ${copySourceCount} ${copySourceCount === 1 ? "entry" : "entries"}`}
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
              onMealsChanged={() => setMealsVersion((version) => version + 1)}
            />
          </section>
        )}
      </div>

      <SaveMealSheet
        open={saveDraft != null}
        draft={saveDraft}
        onClose={() => setSaveDraft(null)}
        onSaved={() => {
          setMealsVersion((version) => version + 1);
          setSaveDraft(null);
        }}
      />
    </>
  );
}
