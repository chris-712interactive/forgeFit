"use client";

import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import { BUILTIN_MACRO_PRESETS } from "@/lib/nutrition/presets";
import { formatMacroLine, loadSavedMeals } from "@/lib/nutrition/saved-meals";
import type { MacroQuickEntry } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SaveMealDraft } from "./save-meal-sheet";

interface MacroPresetsProps {
  loggedDate: string;
  recentEntries: MacroQuickEntry[];
  refreshKey?: number;
  onEditPreset?: (draft: SaveMealDraft) => void;
  onSaveMeal?: (draft: SaveMealDraft) => void;
  onOpenMyMeals?: () => void;
}

function toDraft(entry: MacroQuickEntry): SaveMealDraft {
  return {
    name: entry.foodName,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
  };
}

export function MacroPresets({
  loggedDate,
  recentEntries,
  refreshKey = 0,
  onEditPreset,
  onSaveMeal,
  onOpenMyMeals,
}: MacroPresetsProps) {
  const router = useRouter();
  const [savedCount, setSavedCount] = useState(0);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedCount(loadSavedMeals().length);
  }, [refreshKey]);

  async function logDraft(draft: SaveMealDraft, logId: string) {
    setLoggingId(logId);
    setError(null);
    try {
      await postMacroLogEntry({
        foodName: draft.name,
        calories: draft.calories,
        proteinG: draft.proteinG,
        carbsG: draft.carbsG,
        fatG: draft.fatG,
        loggedDate,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log entry.");
    } finally {
      setLoggingId(null);
    }
  }

  const recentDrafts = recentEntries.map((entry, index) => ({
    id: `recent-${index}`,
    draft: toDraft(entry),
  }));

  const hasQuickAdd =
    BUILTIN_MACRO_PRESETS.length > 0 || recentDrafts.length > 0 || savedCount > 0;

  if (!hasQuickAdd) return null;

  return (
    <div className="space-y-4">
      {savedCount > 0 && onOpenMyMeals && (
        <button
          type="button"
          onClick={onOpenMyMeals}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-forge-ember/25 bg-forge-ember/5 px-4 py-3 text-left transition-colors hover:border-forge-ember/40 hover:bg-forge-ember/10"
        >
          <div>
            <p className="font-display text-sm font-semibold text-forge-text">
              My Meals
            </p>
            <p className="text-xs text-forge-muted">
              {savedCount} saved {savedCount === 1 ? "meal" : "meals"} · organized by category
            </p>
          </div>
          <span className="text-sm font-semibold text-forge-ember">Open →</span>
        </button>
      )}

      {BUILTIN_MACRO_PRESETS.length > 0 && (
        <QuickAddStrip title="Common meals">
          {BUILTIN_MACRO_PRESETS.map((preset) => (
            <BuiltinChip
              key={preset.id}
              name={preset.name}
              summary={`${Math.round(preset.calories)} · ${preset.proteinG}g P`}
              disabled={loggingId === preset.id}
              onLog={() =>
                void logDraft(
                  {
                    name: preset.name,
                    calories: preset.calories,
                    proteinG: preset.proteinG,
                    carbsG: preset.carbsG,
                    fatG: preset.fatG,
                  },
                  preset.id
                )
              }
            />
          ))}
        </QuickAddStrip>
      )}

      {recentDrafts.length > 0 && (
        <QuickAddStrip title="Recent">
          {recentDrafts.map(({ id, draft }) => (
            <RecentCard
              key={id}
              draft={draft}
              disabled={loggingId === id}
              onLog={() => void logDraft(draft, id)}
              onEdit={onEditPreset ? () => onEditPreset(draft) : undefined}
              onSave={onSaveMeal ? () => onSaveMeal(draft) : undefined}
            />
          ))}
        </QuickAddStrip>
      )}

      {error && <p className="text-sm text-forge-coral">{error}</p>}
    </div>
  );
}

function QuickAddStrip({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
        {title}
      </h3>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function BuiltinChip({
  name,
  summary,
  disabled,
  onLog,
}: {
  name: string;
  summary: string;
  disabled: boolean;
  onLog: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onLog}
      className="shrink-0 snap-start rounded-full border border-[var(--border)] bg-forge-surface px-3.5 py-2.5 text-left transition-colors hover:border-forge-ember/50 disabled:opacity-50"
    >
      <span className="whitespace-nowrap text-sm font-medium text-forge-text">
        {name}
      </span>
      <span className="mt-0.5 block whitespace-nowrap text-xs text-forge-muted">
        {summary}
      </span>
    </button>
  );
}

function RecentCard({
  draft,
  disabled,
  onLog,
  onEdit,
  onSave,
}: {
  draft: SaveMealDraft;
  disabled: boolean;
  onLog: () => void;
  onEdit?: () => void;
  onSave?: () => void;
}) {
  return (
    <div className="relative shrink-0 snap-start w-[168px] rounded-xl border border-[var(--border)] bg-forge-surface p-3">
      {onSave && (
        <button
          type="button"
          aria-label={`Save ${draft.name} to My Meals`}
          onClick={onSave}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-forge-muted transition-colors hover:bg-forge-surface-raised hover:text-forge-ember"
        >
          <BookmarkIcon />
        </button>
      )}
      <button
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        className="block w-full pr-7 text-left disabled:cursor-default"
      >
        <p className="truncate font-medium text-sm text-forge-text">{draft.name}</p>
        <p className="mt-1 truncate text-xs text-forge-muted">
          {formatMacroLine(draft)}
        </p>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onLog}
        className="mt-2.5 flex min-h-[40px] w-full items-center justify-center rounded-lg bg-forge-surface-raised text-sm font-semibold text-forge-ember transition-colors hover:bg-forge-ember/10 disabled:opacity-50"
      >
        {disabled ? "…" : "+ Log"}
      </button>
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
