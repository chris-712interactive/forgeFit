"use client";

import { acceptExperiencePromotion } from "@/app/actions/progression";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { PromotionEvaluation } from "@/lib/progression/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface TrainingConsistencyCardProps {
  evaluation: PromotionEvaluation | null;
}

export function TrainingConsistencyCard({
  evaluation,
}: TrainingConsistencyCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!evaluation?.nextLevel || !evaluation.progress) {
    return null;
  }

  const { progress, nextLevel, eligible } = evaluation;
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

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptExperiencePromotion();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            {evaluation.headline}
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            {eligible
              ? `You've met the consistency bar for ${levelLabel}.`
              : `Hit your planned workouts to unlock ${levelLabel} programming.`}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold capitalize text-forge-text">
          {evaluation.currentLevel}
        </span>
      </div>

      <div className="mt-4 space-y-4">
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
      </div>

      {progress.weeklyAdherence.length > 0 && (
        <div className="mt-4 flex gap-1">
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
      )}

      {eligible && (
        <button
          type="button"
          disabled={pending}
          onClick={handleAccept}
          className="mt-4 min-h-[44px] w-full rounded-xl border border-forge-gold/50 bg-forge-gold/10 font-display text-sm font-bold text-forge-gold disabled:opacity-60"
        >
          {pending ? "Updating plan…" : `Upgrade to ${levelLabel}`}
        </button>
      )}

      <div className="mt-3">
        <EvidenceExplainerLink
          href={buildEvidenceHref({ focus: evaluation.evidenceRuleId })}
          label="Evidence for promotion criteria"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
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
