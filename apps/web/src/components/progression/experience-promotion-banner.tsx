"use client";

import {
  acceptExperiencePromotion,
  snoozeExperiencePromotion,
} from "@/app/actions/progression";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { PromotionEvaluation } from "@/lib/progression/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ExperiencePromotionBannerProps {
  evaluation: PromotionEvaluation;
}

export function ExperiencePromotionBanner({
  evaluation,
}: ExperiencePromotionBannerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!evaluation.showNudge || !evaluation.nextLevel) {
    return null;
  }

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

  function handleSnooze() {
    setError(null);
    startTransition(async () => {
      const result = await snoozeExperiencePromotion();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const levelLabel =
    evaluation.nextLevel.charAt(0).toUpperCase() +
    evaluation.nextLevel.slice(1);

  return (
    <section className="rounded-2xl border border-forge-gold/40 bg-gradient-to-br from-forge-gold/10 to-forge-ember/5 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        Level up available
      </p>
      <h2 className="mt-1 font-display text-lg font-bold text-forge-text">
        {evaluation.headline}
      </h2>
      <p className="mt-2 text-sm text-forge-muted">
        Your consistency earned a move to{" "}
        <span className="font-medium text-forge-text">{levelLabel}</span> —
        more volume, harder exercises, and updated macro targets grounded in
        the same evidence rules.
      </p>
      <p className="mt-2 text-xs text-forge-muted">{evaluation.detail}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={handleAccept}
          className="min-h-[48px] flex-1 rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Updating plan…" : `Upgrade to ${levelLabel}`}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleSnooze}
          className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] text-sm font-semibold text-forge-muted hover:border-forge-ember/40"
        >
          Not yet
        </button>
      </div>

      <div className="mt-3">
        <EvidenceExplainerLink
          href={buildEvidenceHref({ focus: evaluation.evidenceRuleId })}
          label="Why we promote on adherence"
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
