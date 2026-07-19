"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import type { DetectedWorkoutPr } from "@/lib/coaching/detect-pr";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { useEffect } from "react";

interface PrToastProps {
  pr: DetectedWorkoutPr;
  headline: string;
  onClose: () => void;
}

export function PrToast({ pr, headline, onClose }: PrToastProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);

  useEffect(() => {
    const timer = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-28 left-1/2 z-[110] w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-forge-gold/40 bg-forge-surface-raised px-4 py-3 shadow-2xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-gold">
            Personal record
          </p>
          <p className="mt-1 font-display text-sm font-semibold text-forge-text">
            {headline}
          </p>
          <p className="mt-1 text-xs text-forge-muted">
            ~{kgToDisplayValue(pr.e1rmKg, unit)} {weightLabel} e1RM
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-medium text-forge-muted hover:text-forge-text"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
