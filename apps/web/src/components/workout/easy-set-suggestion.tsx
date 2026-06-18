"use client";

import type { EasySetSuggestion } from "@/lib/workouts/in-session-progression";

interface EasySetSuggestionProps {
  suggestion: EasySetSuggestion;
  weightLabel: string;
  displayWeight?: number;
  canAddBonusSet?: boolean;
  onApplyWeight?: () => void;
  onAddBonusSet?: () => void;
  onDismiss?: () => void;
}

export function EasySetSuggestionBanner({
  suggestion,
  weightLabel,
  displayWeight,
  canAddBonusSet = false,
  onApplyWeight,
  onAddBonusSet,
  onDismiss,
}: EasySetSuggestionProps) {
  return (
    <div className="mt-3 rounded-xl border border-forge-gold/30 bg-forge-gold/5 p-3">
      <p className="text-sm text-forge-text">{suggestion.message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestion.kind === "increase_weight" && onApplyWeight && (
          <button
            type="button"
            onClick={onApplyWeight}
            className="min-h-[40px] rounded-lg bg-forge-ember px-3 text-sm font-semibold text-white"
          >
            {displayWeight != null
              ? `Use ${displayWeight} ${weightLabel} next set`
              : "Use heavier weight next set"}
          </button>
        )}
        {suggestion.kind === "add_set" && onAddBonusSet && (
          <button
            type="button"
            onClick={onAddBonusSet}
            className="min-h-[40px] rounded-lg bg-forge-ember px-3 text-sm font-semibold text-white"
          >
            Add bonus set
          </button>
        )}
        {suggestion.kind === "increase_weight" &&
          canAddBonusSet &&
          onAddBonusSet && (
            <button
              type="button"
              onClick={onAddBonusSet}
              className="min-h-[40px] rounded-lg border border-forge-gold/40 px-3 text-sm font-semibold text-forge-gold"
            >
              Add bonus set instead
            </button>
          )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[40px] rounded-lg px-3 text-sm font-medium text-forge-muted"
          >
            Keep as-is
          </button>
        )}
      </div>
    </div>
  );
}
