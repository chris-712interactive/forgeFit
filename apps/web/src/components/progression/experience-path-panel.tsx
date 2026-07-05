"use client";

import {
  acceptExperiencePromotion,
  snoozeExperiencePromotion,
} from "@/app/actions/progression";
import { readActionError } from "@/lib/auth/action-result";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { PlanScheduleStartField } from "@/components/profile/plan-schedule-start-field";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { todayScheduleStartIso } from "@/lib/programs/start-date";
import type { PromotionEvaluation } from "@/lib/progression/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface ExperiencePathPanelProps {
  evaluation: PromotionEvaluation;
  onClose: () => void;
}

export function ExperiencePathPanel({
  evaluation,
  onClose,
}: ExperiencePathPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scheduleStartDate, setScheduleStartDate] = useState(
    todayScheduleStartIso()
  );

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!evaluation.nextLevel || !evaluation.progress) {
    return null;
  }

  const { progress, nextLevel, eligible, showNudge } = evaluation;
  const weekPct = Math.min(
    100,
    Math.round(
      (progress.weeksMeetingThreshold / progress.requiredWeeks) * 100
    )
  );
  const sessionPct = Math.min(
    100,
    Math.round(
      (progress.totalQualitySessions / progress.requiredSessions) * 100
    )
  );
  const levelLabel =
    nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1);
  const currentLabel =
    evaluation.currentLevel.charAt(0).toUpperCase() +
    evaluation.currentLevel.slice(1);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptExperiencePromotion({
        schedule_start_date: scheduleStartDate,
      });
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function handleSnooze() {
    setError(null);
    startTransition(async () => {
      const result = await snoozeExperiencePromotion();
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experience-path-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90dvh,720px)] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--border)] bg-forge-surface-raised shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`border-b border-[var(--border)] px-5 py-5 sm:px-6 ${
            showNudge
              ? "bg-gradient-to-br from-forge-gold/15 to-forge-ember/5"
              : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                {currentLabel} → {levelLabel}
              </p>
              <h2
                id="experience-path-title"
                className="mt-1 font-display text-lg font-bold text-forge-text"
              >
                {evaluation.headline}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-forge-muted hover:text-forge-text"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-sm text-forge-muted">
            {showNudge
              ? `Your consistency earned a move to ${levelLabel} — more volume, harder exercises, and updated macro targets from the same evidence rules.`
              : eligible
                ? `You've met the consistency bar for ${levelLabel}.`
                : `Hit your planned workouts to unlock ${levelLabel} programming.`}
          </p>
          <p className="mt-2 text-xs text-forge-muted">{evaluation.detail}</p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <ProgressRow
            label="Weeks on plan"
            current={progress.weeksMeetingThreshold}
            target={progress.requiredWeeks}
            pct={weekPct}
            hint={`${Math.round(progress.adherenceThresholdPct * 100)}%+ of planned sessions / week`}
          />
          <ProgressRow
            label="Quality sessions"
            current={progress.totalQualitySessions}
            target={progress.requiredSessions}
            pct={sessionPct}
            hint={`Last ${progress.lookbackWeeks} weeks · log at least half your sets`}
          />

          {progress.weeklyAdherence.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Recent weeks
              </p>
              <div className="flex gap-1">
                {progress.weeklyAdherence.map((week) => (
                  <div
                    key={week.weekStartIso}
                    title={`Week of ${week.weekStartIso}: ${week.completed}/${week.planned}`}
                    className={`h-8 flex-1 rounded-md ${
                      week.meetsThreshold ? "bg-forge-gold" : "bg-forge-surface"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {(showNudge || eligible) && (
            <PlanScheduleStartField
              id="promotion-schedule-start-date"
              value={scheduleStartDate}
              onChange={setScheduleStartDate}
              description="Your upgraded plan begins on this date."
            />
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {(showNudge || eligible) && (
              <button
                type="button"
                disabled={pending}
                onClick={handleAccept}
                className="min-h-[48px] flex-1 rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? "Updating plan…" : `Upgrade to ${levelLabel}`}
              </button>
            )}
            {showNudge && (
              <button
                type="button"
                disabled={pending}
                onClick={handleSnooze}
                className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] text-sm font-semibold text-forge-muted hover:border-forge-ember/40"
              >
                Not yet
              </button>
            )}
          </div>

          <EvidenceExplainerLink
            href={buildEvidenceHref({ focus: evaluation.evidenceRuleId })}
            label={
              showNudge
                ? "Why we promote on adherence"
                : "Evidence for promotion criteria"
            }
          />

          {error && (
            <p className="text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  current,
  target,
  pct,
  hint,
}: {
  label: string;
  current: number;
  target: number;
  pct: number;
  hint: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-forge-text">{label}</span>
        <span className="text-forge-muted">
          {current}/{target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-forge-surface">
        <div
          className="h-full rounded-full bg-forge-steel transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-forge-muted">{hint}</p>
    </div>
  );
}
