"use client";

import type { DetectedWorkoutPr } from "@/lib/coaching/detect-pr";
import { useEffect } from "react";

interface PrCelebrationModalProps {
  pr: DetectedWorkoutPr;
  headline: string;
  body: string;
  onClose: () => void;
}

export function PrCelebrationModal({
  pr,
  headline,
  body,
  onClose,
}: PrCelebrationModalProps) {
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
            ~{pr.e1rmKg} kg e1RM
          </p>
        </div>
        <div className="bg-forge-surface-raised px-6 py-4">
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
