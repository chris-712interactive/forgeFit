"use client";

import { postMacroLogEntry } from "@/lib/nutrition/log-entry";
import {
  isNutritionFavorite,
  loadNutritionFavorites,
  toggleNutritionFavorite,
} from "@/lib/nutrition/favorites";
import { BUILTIN_MACRO_PRESETS } from "@/lib/nutrition/presets";
import { formatMacroLine } from "@/lib/nutrition/saved-meals";
import type { MacroQuickEntry } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DiaryQuickLogProps {
  loggedDate: string;
  recentEntries: MacroQuickEntry[];
}

export function DiaryQuickLog({ loggedDate, recentEntries }: DiaryQuickLogProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<MacroQuickEntry[]>([]);
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(loadNutritionFavorites());
  }, []);

  const recentToShow = recentEntries.slice(0, 8);
  const hasContent =
    favorites.length > 0 ||
    recentToShow.length > 0 ||
    BUILTIN_MACRO_PRESETS.length > 0;

  if (!hasContent) return null;

  async function logEntry(entry: MacroQuickEntry, key: string) {
    setLoggingKey(key);
    setError(null);
    try {
      await postMacroLogEntry({
        foodName: entry.foodName,
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        loggedDate,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log entry.");
    } finally {
      setLoggingKey(null);
    }
  }

  function handleToggleFavorite(entry: MacroQuickEntry) {
    setFavorites(toggleNutritionFavorite(entry));
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Quick log
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Tap to log again — favorites stay pinned on this device.
      </p>

      <div className="mt-4 space-y-4">
        {favorites.length > 0 && (
          <QuickLogStrip title="Favorites">
            {favorites.map((entry) => (
              <QuickLogChip
                key={`fav-${entry.foodName}`}
                entry={entry}
                disabled={loggingKey === `fav-${entry.foodName}`}
                pinned
                onLog={() => void logEntry(entry, `fav-${entry.foodName}`)}
                onTogglePin={() => handleToggleFavorite(entry)}
              />
            ))}
          </QuickLogStrip>
        )}

        {recentToShow.length > 0 && (
          <QuickLogStrip title="Recent">
            {recentToShow.map((entry, index) => (
              <QuickLogChip
                key={`recent-${index}`}
                entry={entry}
                disabled={loggingKey === `recent-${index}`}
                pinned={isNutritionFavorite(entry, favorites)}
                onLog={() => void logEntry(entry, `recent-${index}`)}
                onTogglePin={() => handleToggleFavorite(entry)}
              />
            ))}
          </QuickLogStrip>
        )}

        {BUILTIN_MACRO_PRESETS.length > 0 && (
          <QuickLogStrip title="Common">
            {BUILTIN_MACRO_PRESETS.map((preset) => (
              <QuickLogChip
                key={preset.id}
                entry={{
                  foodName: preset.name,
                  calories: preset.calories,
                  proteinG: preset.proteinG,
                  carbsG: preset.carbsG,
                  fatG: preset.fatG,
                }}
                disabled={loggingKey === preset.id}
                onLog={() =>
                  void logEntry(
                    {
                      foodName: preset.name,
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
          </QuickLogStrip>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-forge-coral">{error}</p>}
    </section>
  );
}

function QuickLogStrip({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-forge-steel">{title}</h3>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function QuickLogChip({
  entry,
  disabled,
  pinned = false,
  onLog,
  onTogglePin,
}: {
  entry: MacroQuickEntry;
  disabled: boolean;
  pinned?: boolean;
  onLog: () => void;
  onTogglePin?: () => void;
}) {
  return (
    <div className="relative shrink-0 snap-start w-[168px] rounded-xl border border-[var(--border)] bg-forge-surface p-3">
      {onTogglePin && (
        <button
          type="button"
          aria-label={pinned ? "Remove from favorites" : "Add to favorites"}
          onClick={onTogglePin}
          className={`absolute right-2 top-2 rounded-lg p-1.5 transition-colors hover:bg-forge-surface-raised ${
            pinned ? "text-forge-ember" : "text-forge-muted hover:text-forge-ember"
          }`}
        >
          <PinIcon filled={pinned} />
        </button>
      )}
      <p className="truncate pr-7 text-sm font-medium text-forge-text">
        {entry.foodName}
      </p>
      <p className="mt-1 truncate text-xs text-forge-muted">
        {formatMacroLine(entry)}
      </p>
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

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}
