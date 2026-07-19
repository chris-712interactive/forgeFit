"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { useEffect } from "react";

interface MaxTestResultModalProps {
  exerciseLabel: string;
  weightKg: number;
  saved: boolean;
  onClose: () => void;
}

export function MaxTestResultModal({
  exerciseLabel,
  weightKg,
  saved,
  onClose,
}: MaxTestResultModalProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);

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
      aria-labelledby="max-test-result-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-forge-gold/40 shadow-2xl">
        <div className="gradient-forge-celebrate px-6 py-8 text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            1RM recorded
          </p>
          <h2
            id="max-test-result-title"
            className="font-display mt-3 text-2xl font-bold text-white"
          >
            {exerciseLabel}
          </h2>
          <p className="mt-4 font-display text-3xl font-bold text-white">
            {kgToDisplayValue(weightKg, unit)} {weightLabel}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/95">
            {saved
              ? "Saved to your training maxes and ready for future prescriptions."
              : "Logged in this workout. Connect online to save it to your profile."}
          </p>
        </div>
        <div className="bg-forge-surface-raised px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-forge-ember px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
