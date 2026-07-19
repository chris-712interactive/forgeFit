"use client";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import type { TdeeDashboard } from "@/lib/nutrition/tdee-service";
import { SectionTabs } from "@/components/layout/section-tabs";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { appSectionStack } from "@/components/layout/page-layout";
import { MfpImportPanel } from "@/components/nutrition/mfp-import-panel";
import { PackagedFoodPanel } from "@/components/nutrition/packaged-food-panel";
import { NutritionDatePicker } from "@/components/nutrition/nutrition-date-picker";
import { CopyDayPanel } from "@/components/nutrition/copy-day-panel";
import { DiaryQuickLog } from "@/components/nutrition/diary-quick-log";
import { EditEntrySheet } from "@/components/nutrition/edit-entry-sheet";
import { formatNutritionDayShort } from "@/lib/nutrition/date-param";
import type { DailyNutritionSummary, MacroQuickEntry, NutritionLogRow } from "@/lib/nutrition/types";
import { useOfflineStatus } from "@/hooks/use-online-status";
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
  recentEntries: MacroQuickEntry[];
  selectedDate: string;
  todayIso: string;
  yesterdayIso: string;
  isViewingToday: boolean;
  previousDayDate: string;
  previousDayEntryCount: number;
  yesterdayEntryCount: number;
  yesterdayDate: string;
  restaurantSearchUnlocked: boolean;
  savedMealsUnlocked: boolean;
  tdeeDashboard: TdeeDashboard | null;
}

export function NutritionDiary({
  initialSummary,
  recentEntries,
  selectedDate,
  todayIso,
  yesterdayIso,
  isViewingToday,
  previousDayDate,
  previousDayEntryCount,
  yesterdayEntryCount,
  yesterdayDate,
  restaurantSearchUnlocked,
  savedMealsUnlocked,
  tdeeDashboard,
}: NutritionDiaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offline = useOfflineStatus();
  const [tab, setTab] = useState<DiaryTab>(() =>
    parseTab(searchParams.get("tab"))
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [mealsVersion, setMealsVersion] = useState(0);
  const [saveDraft, setSaveDraft] = useState<SaveMealDraft | null>(null);
  const [editingEntry, setEditingEntry] = useState<NutritionLogRow | null>(null);

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
        {offline && (
          <p className="rounded-xl border border-forge-steel/30 bg-forge-steel/5 px-4 py-3 text-sm text-forge-steel">
            You&apos;re offline — logging and food search need a connection.
            Browse whole foods in Build Meal still works on-device.
          </p>
        )}

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
                showRemainingHighlight
              />
            </section>

            <DiaryQuickLog
              loggedDate={initialSummary.date}
              recentEntries={recentEntries}
            />

            {copySourceCount > 0 && (
              <CopyDayPanel
                isViewingToday={isViewingToday}
                selectedDate={selectedDate}
                copySourceDate={copySourceDate}
                copySourceCount={copySourceCount}
                copying={copying}
                copyError={copyError}
                onCopy={() => void handleCopyFromPreviousDay()}
                compact={entryCount > 0}
              />
            )}

            {tdeeDashboard && isViewingToday && (
              <TdeeEnergyPanel dashboard={tdeeDashboard} />
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
              <LoggedEntries
                entries={initialSummary.entries}
                loggedDate={initialSummary.date}
                targets={initialSummary.targets}
                deletingId={deletingId}
                onDelete={(id) => void handleDelete(id)}
                onEdit={setEditingEntry}
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
              onSaveMeal={savedMealsUnlocked ? setSaveDraft : undefined}
            />

            <PackagedFoodPanel loggedDate={initialSummary.date} />

            <MfpImportPanel />

            <CollapsibleSection title="Example plates" hint="Scaled to your targets">
              <MealPlateExamples targets={initialSummary.targets} embedded />
            </CollapsibleSection>
          </div>
        )}

        {tab === "my-meals" && (
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            {savedMealsUnlocked ? (
              <SavedMealsLibrary
                loggedDate={initialSummary.date}
                refreshKey={mealsVersion}
                onMealsChanged={() => setMealsVersion((version) => version + 1)}
              />
            ) : (
              <UpgradePrompt
                title="Saved meals are a Pro+ feature"
                description="Build reusable meals on this device and log them in one tap — included with restaurant quick-log on Pro+."
                suggestedTier="pro_plus"
              />
            )}
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

      <EditEntrySheet
        open={editingEntry != null}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
      />
    </>
  );
}
