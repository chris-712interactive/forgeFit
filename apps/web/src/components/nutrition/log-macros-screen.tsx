"use client";

import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { NutritionDatePicker } from "@/components/nutrition/nutrition-date-picker";
import type { DailyNutritionSummary, MacroQuickEntry } from "@/lib/nutrition/types";
import { buildNutritionHref } from "@/lib/nutrition/date-param";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MacroPresets } from "./macro-presets";
import { NutritionBackLink } from "./nutrition-back-link";
import { QuickMacroLog } from "./quick-macro-log";
import { SavedMealsQuickLog } from "./saved-meals-quick-log";
import { SaveMealSheet, type SaveMealDraft } from "./save-meal-sheet";

interface LogMacrosScreenProps {
  summary: DailyNutritionSummary;
  recentEntries: MacroQuickEntry[];
  selectedDate: string;
  todayIso: string;
  yesterdayIso: string;
}

export function LogMacrosScreen({
  summary,
  recentEntries,
  selectedDate,
  todayIso,
  yesterdayIso,
}: LogMacrosScreenProps) {
  const router = useRouter();
  const [mealsVersion, setMealsVersion] = useState(0);
  const [formPrefill, setFormPrefill] = useState<SaveMealDraft | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [saveDraft, setSaveDraft] = useState<SaveMealDraft | null>(null);

  function handleEditPreset(draft: SaveMealDraft) {
    setFormPrefill(draft);
    setFormKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={appPagePadding}>
      <NutritionBackLink todayIso={todayIso} />

      <div className={appHeaderGap}>
        <h1 className="font-display text-2xl font-bold text-forge-text">
          Log macros
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Enter totals directly or tap a preset — saved meals adjust portions
          before logging.
        </p>
      </div>

      <div className={`${appHeaderGap} ${appSectionStack}`}>
        <NutritionDatePicker
          selectedDate={selectedDate}
          todayIso={todayIso}
          yesterdayIso={yesterdayIso}
          entryCount={summary.entries.length}
          compact
          basePath="/nutrition/log-macros"
        />

        <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Manual entry
          </h2>
          <div className="mt-4">
            <QuickMacroLog
              key={`${formKey}-${summary.date}`}
              loggedDate={summary.date}
              totals={summary.totals}
              targets={summary.targets}
              initialValues={formPrefill}
              onSaveMeal={setSaveDraft}
            />
          </div>
        </section>

        <SavedMealsQuickLog
          loggedDate={summary.date}
          refreshKey={mealsVersion}
        />

        <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Quick add
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Common or recent items — bookmark recent meals to My Meals
          </p>
          <div className="mt-4">
            <MacroPresets
              key={`${mealsVersion}-${summary.date}`}
              loggedDate={summary.date}
              recentEntries={recentEntries}
              refreshKey={mealsVersion}
              onEditPreset={handleEditPreset}
              onSaveMeal={setSaveDraft}
              onOpenMyMeals={() =>
                router.push(
                  buildNutritionHref({ date: selectedDate, tab: "my-meals" })
                )
              }
            />
          </div>
        </section>
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
    </div>
  );
}
