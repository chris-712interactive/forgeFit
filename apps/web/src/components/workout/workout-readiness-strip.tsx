"use client";

import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { WorkoutReadinessContext } from "@/lib/workouts/device-metrics-types";

interface WorkoutReadinessStripProps {
  readiness: WorkoutReadinessContext | null;
}

const STATUS_STYLES = {
  ready: "border-forge-success/30 bg-forge-success/5 text-forge-text",
  caution: "border-forge-gold/30 bg-forge-gold/5 text-forge-text",
  recovery_day: "border-forge-coral/30 bg-forge-coral/5 text-forge-text",
} as const;

const STATUS_LABELS = {
  ready: "Ready to train",
  caution: "Train with caution",
  recovery_day: "Recovery day signals",
} as const;

export function WorkoutReadinessStrip({ readiness }: WorkoutReadinessStripProps) {
  if (!readiness?.unlocked || !readiness.fitbitConnected) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border px-4 py-3 ${STATUS_STYLES[readiness.status]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
        {STATUS_LABELS[readiness.status]}
      </p>
      <p className="mt-1 text-sm">{readiness.message}</p>
      <div className="mt-2">
        <EvidenceExplainerLink
          href={buildEvidenceHref({ focus: "recovery_sleep" })}
          label="Why recovery matters"
        />
      </div>
    </section>
  );
}
