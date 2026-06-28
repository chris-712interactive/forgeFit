"use client";

import type { TdeeDashboard } from "@/lib/nutrition/tdee-service";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import { SectionTabs } from "@/components/layout/section-tabs";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { appSectionStack } from "@/components/layout/page-layout";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoggedEntries } from "./logged-entries";
import { MealPlateExamples } from "./meal-plate-examples";
import { MacroSummary } from "./macro-summary";
import { RestaurantSearchPanel } from "./restaurant-search-panel";
import { SavedMealsLibrary } from "./saved-meals-library";
import { SaveMealSheet, type SaveMealDraft } from "./save-meal-sheet";
import { TdeeEnergyPanel } from "./tdee-energy-panel";

type DiaryTab = "today" | "browse" | "my-meals";

const VALID_TABS = new Set<DiaryTab>(["today", "browse", "my-meals"]);

function parseTab(value: string | null): DiaryTab {
  if (value && VALID_TABS.has(value as DiaryTab)) {
    return value as DiaryTab;
  }
  return "today";
}

interface NutritionDiaryProps {
  initialSummary: DailyNutritionSummary;
  yesterdayEntryCount: number;
  yesterdayDate: string;
  restaurantSearchUnlocked: boolean;
  tdeeDashboard: TdeeDashboard | null;
}

export function NutritionDiary({
  initialSummary,
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

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  function handleTabChange(nextTab: DiaryTab) {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "today") {
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
          onChange={(id) => handleTabChange(id as DiaryTab)}
          tabs={[
            { id: "today", label: "Today" },
            { id: "browse", label: "Browse" },
            { id: "my-meals", label: "My Meals" },
          ]}
        />

        {tab === "today" && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <section className="rounded-2xl border border-forge-ember/25 bg-forge-surface-raised p-4 sm:p-5">
              <MacroSummary
                totals={initialSummary.totals}
                targets={initialSummary.targets}
                variant="compact"
                embedded
                showTargetDetails={false}
              />
            </section>

            {tdeeDashboard && <TdeeEnergyPanel dashboard={tdeeDashboard} />}

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
              onSaveMeal={setSaveDraft}
            />

            <CollapsibleSection title="Example plates" hint="Scaled to your targets">
              <MealPlateExamples targets={initialSummary.targets} embedded />
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
