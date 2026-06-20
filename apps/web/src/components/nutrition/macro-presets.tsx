"use client";

import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  BUILTIN_MACRO_PRESETS,
  loadSavedMacroPresets,
  removeMacroPreset,
  type MacroPreset,
} from "@/lib/nutrition/presets";
import type { MacroQuickEntry } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface MacroPresetsProps {
  loggedDate: string;
  recentEntries: MacroQuickEntry[];
  onEditPreset?: (preset: MacroPreset) => void;
}

function toPreset(entry: MacroQuickEntry, id: string): MacroPreset {
  return {
    id,
    name: entry.foodName,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
  };
}

function formatMacroLine(preset: MacroPreset): string {
  const parts = [
    `${Math.round(preset.calories)} kcal`,
    `${preset.proteinG}g P`,
  ];
  if (preset.carbsG > 0) parts.push(`${preset.carbsG}g C`);
  if (preset.fatG > 0) parts.push(`${preset.fatG}g F`);
  return parts.join(" · ");
}

export function MacroPresets({
  loggedDate,
  recentEntries,
  onEditPreset,
}: MacroPresetsProps) {
  const router = useRouter();
  const [saved, setSaved] = useState<MacroPreset[]>([]);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadSavedMacroPresets());
  }, []);

  const refreshSaved = useCallback(() => {
    setSaved(loadSavedMacroPresets());
  }, []);

  async function logPreset(preset: MacroPreset) {
    setLoggingId(preset.id);
    setError(null);
    try {
      await postMacroLogEntry({
        foodName: preset.name,
        calories: preset.calories,
        proteinG: preset.proteinG,
        carbsG: preset.carbsG,
        fatG: preset.fatG,
        loggedDate,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log preset.");
    } finally {
      setLoggingId(null);
    }
  }

  const recentPresets = recentEntries.map((entry, index) =>
    toPreset(entry, `recent-${index}`)
  );

  const hasQuickAdd =
    BUILTIN_MACRO_PRESETS.length > 0 ||
    recentPresets.length > 0 ||
    saved.length > 0;

  if (!hasQuickAdd) return null;

  return (
    <div className="space-y-4">
      {BUILTIN_MACRO_PRESETS.length > 0 && (
        <QuickAddStrip title="Common meals">
          {BUILTIN_MACRO_PRESETS.map((preset) => (
            <BuiltinChip
              key={preset.id}
              preset={preset}
              disabled={loggingId === preset.id}
              onLog={() => void logPreset(preset)}
            />
          ))}
        </QuickAddStrip>
      )}

      {recentPresets.length > 0 && (
        <QuickAddStrip title="Recent">
          {recentPresets.map((preset) => (
            <QuickAddCard
              key={preset.id}
              preset={preset}
              disabled={loggingId === preset.id}
              onLog={() => void logPreset(preset)}
              onEdit={onEditPreset ? () => onEditPreset(preset) : undefined}
            />
          ))}
        </QuickAddStrip>
      )}

      {saved.length > 0 && (
        <QuickAddStrip title="Saved meals">
          {saved.map((preset) => (
            <QuickAddCard
              key={preset.id}
              preset={preset}
              disabled={loggingId === preset.id}
              onLog={() => void logPreset(preset)}
              onEdit={onEditPreset ? () => onEditPreset(preset) : undefined}
              onRemove={() => {
                removeMacroPreset(preset.id);
                refreshSaved();
              }}
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
  preset,
  disabled,
  onLog,
}: {
  preset: MacroPreset;
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
        {preset.name}
      </span>
      <span className="mt-0.5 block whitespace-nowrap text-xs text-forge-muted">
        {Math.round(preset.calories)} · {preset.proteinG}g P
      </span>
    </button>
  );
}

function QuickAddCard({
  preset,
  disabled,
  onLog,
  onEdit,
  onRemove,
}: {
  preset: MacroPreset;
  disabled: boolean;
  onLog: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative shrink-0 snap-start w-[152px] rounded-xl border border-[var(--border)] bg-forge-surface p-3">
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${preset.name}`}
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-xs text-forge-muted hover:text-forge-coral"
        >
          ×
        </button>
      )}
      <button
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        className="block w-full text-left disabled:cursor-default"
      >
        <p className="truncate pr-4 font-medium text-sm text-forge-text">
          {preset.name}
        </p>
        <p className="mt-1 truncate text-xs text-forge-muted">
          {formatMacroLine(preset)}
        </p>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onLog}
        aria-label={`Log ${preset.name}`}
        className="mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-forge-surface-raised text-sm font-semibold text-forge-ember transition-colors hover:bg-forge-ember/10 disabled:opacity-50"
      >
        {disabled ? "…" : "+ Log"}
      </button>
    </div>
  );
}
