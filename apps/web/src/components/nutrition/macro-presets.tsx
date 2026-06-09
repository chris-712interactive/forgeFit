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

export function MacroPresets({ loggedDate, recentEntries }: MacroPresetsProps) {
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

  return (
    <section className="space-y-4">
      <PresetGroup
        title="Quick add"
        presets={BUILTIN_MACRO_PRESETS}
        loggingId={loggingId}
        onLog={logPreset}
      />

      {recentPresets.length > 0 && (
        <PresetGroup
          title="Recent"
          presets={recentPresets}
          loggingId={loggingId}
          onLog={logPreset}
        />
      )}

      {saved.length > 0 && (
        <PresetGroup
          title="My presets"
          presets={saved}
          loggingId={loggingId}
          onLog={logPreset}
          onRemove={(id) => {
            removeMacroPreset(id);
            refreshSaved();
          }}
        />
      )}

      {error && <p className="text-sm text-forge-coral">{error}</p>}
    </section>
  );
}

function PresetGroup({
  title,
  presets,
  loggingId,
  onLog,
  onRemove,
}: {
  title: string;
  presets: MacroPreset[];
  loggingId: string | null;
  onLog: (preset: MacroPreset) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
        {title}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <li key={preset.id} className="flex items-center gap-1">
            <button
              type="button"
              disabled={loggingId === preset.id}
              onClick={() => void onLog(preset)}
              className="rounded-full border border-[var(--border)] bg-forge-surface px-3 py-2 text-left text-sm transition-colors hover:border-forge-ember/50 disabled:opacity-50"
            >
              <span className="font-medium text-forge-text">{preset.name}</span>
              <span className="mt-0.5 block text-xs text-forge-muted">
                {Math.round(preset.calories)} kcal · {preset.proteinG}g protein
              </span>
            </button>
            {onRemove && preset.id.startsWith("saved-") && (
              <button
                type="button"
                aria-label={`Remove ${preset.name}`}
                onClick={() => onRemove(preset.id)}
                className="rounded-lg px-2 py-1 text-xs text-forge-muted hover:text-forge-coral"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
