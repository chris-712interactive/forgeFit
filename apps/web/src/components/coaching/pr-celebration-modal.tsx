"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  isActualOneRepMaxPr,
  type DetectedWorkoutPr,
} from "@/lib/coaching/detect-pr";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { useEffect } from "react";

interface PrCelebrationModalProps {
  pr: DetectedWorkoutPr;
  headline: string;
  body: string;
  onClose: () => void;
  onSaveAsMax?: () => void;
  savePending?: boolean;
  saveMessage?: string | null;
}

export function PrCelebrationModal({
  pr,
  headline,
  body,
  onClose,
  onSaveAsMax,
  savePending = false,
  saveMessage = null,
}: PrCelebrationModalProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const actualMax = isActualOneRepMaxPr(pr);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pr-celebration-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-forge-gold/40 shadow-2xl">
        <div className="gradient-forge-celebrate px-6 py-8 text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            Personal record
          </p>
          <h2
            id="pr-celebration-title"
            className="font-display mt-3 text-2xl font-bold text-white"
          >
            {headline}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/95">{body}</p>
          <p className="mt-4 font-display text-3xl font-bold text-white">
            {actualMax
              ? `${kgToDisplayValue(pr.weightKg, unit)} ${weightLabel} 1RM`
              : `~${kgToDisplayValue(pr.e1rmKg, unit)} ${weightLabel} e1RM`}
          </p>
        </div>
        <div className="space-y-2 bg-forge-surface-raised px-6 py-4">
          {onSaveAsMax && (
            <button
              type="button"
              disabled={savePending}
              onClick={onSaveAsMax}
              className="w-full rounded-xl border border-forge-gold/50 px-4 py-3 text-sm font-semibold text-forge-gold transition-colors hover:border-forge-gold disabled:opacity-60"
            >
              {savePending ? "Saving…" : "Save as training max"}
            </button>
          )}
          {saveMessage && (
            <p className="text-center text-xs text-forge-success" role="status">
              {saveMessage}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-forge-ember px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
          >
            Keep forging
          </button>
        </div>
      </div>
    </div>
  );
}
