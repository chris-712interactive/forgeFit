"use client";

import type { PromotionEvaluation } from "@/lib/progression/types";
import { useMemo, useState } from "react";
import { ExperiencePathPanel } from "./experience-path-panel";

interface ExperiencePathIndicatorProps {
  evaluation: PromotionEvaluation | null;
}

function formatLevel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function levelAbbrev(level: string) {
  return formatLevel(level).slice(0, 3);
}

export function ExperiencePathIndicator({
  evaluation,
}: ExperiencePathIndicatorProps) {
  const [open, setOpen] = useState(false);

  const progressPct = useMemo(() => {
    if (!evaluation?.progress) return 0;
    const { progress } = evaluation;
    const weekPct =
      (progress.weeksMeetingThreshold / progress.requiredWeeks) * 100;
    const sessionPct =
      (progress.totalQualitySessions / progress.requiredSessions) * 100;
    return Math.min(100, Math.round((weekPct + sessionPct) / 2));
  }, [evaluation]);

  if (!evaluation?.nextLevel || !evaluation.progress) {
    return null;
  }

  const nextLabel = formatLevel(evaluation.nextLevel);
  const ariaLabel = evaluation.showNudge
    ? `Level up to ${nextLabel} available — open details`
    : `Path to ${nextLabel} — ${progressPct}% complete — open details`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`fixed right-4 z-40 flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg backdrop-blur-md transition-transform hover:scale-[1.02] active:scale-[0.98] ${
          evaluation.showNudge
            ? "border-forge-gold/60 bg-forge-gold/15 text-forge-gold ring-2 ring-forge-gold/30"
            : "border-[var(--border)] bg-forge-surface-raised/95 text-forge-text"
        }`}
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
            evaluation.showNudge
              ? "bg-forge-gold text-forge-surface"
              : "bg-forge-surface text-forge-muted"
          }`}
          aria-hidden
        >
          {evaluation.showNudge ? "↑" : `${progressPct}%`}
        </span>
        <span className="pr-1 text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-forge-muted">
            {evaluation.showNudge ? "Level up" : "Path"}
          </span>
          <span className="block text-xs font-semibold leading-tight">
            {evaluation.showNudge
              ? nextLabel
              : `${levelAbbrev(evaluation.currentLevel)} → ${levelAbbrev(evaluation.nextLevel)}`}
          </span>
        </span>
      </button>

      {open && (
        <ExperiencePathPanel
          evaluation={evaluation}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
