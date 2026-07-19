"use client";

import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { SessionEquipmentEntry } from "@/lib/workouts/session-equipment";

interface WorkoutEquipmentOverviewCardProps {
  sessionName: string;
  equipment: SessionEquipmentEntry[];
  citationRuleIds?: string[];
}

export function WorkoutEquipmentOverviewCard({
  sessionName,
  equipment,
  citationRuleIds = [],
}: WorkoutEquipmentOverviewCardProps) {
  return (
    <section className="rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-steel">
        Today&apos;s equipment
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-forge-text">
        {sessionName}
      </h2>
      <p className="mt-2 text-sm text-forge-muted">
        Grab what you need before you start — everything listed below is used in
        this session.
      </p>

      {equipment.length === 0 ? (
        <p className="mt-4 text-sm text-forge-muted">
          Mostly bodyweight work today.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {equipment.map((item) => (
            <li
              key={item.equipmentKey}
              className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-3"
            >
              <p className="font-medium text-forge-text">{item.label}</p>
              <p className="mt-1 text-xs text-forge-muted">
                {item.usedFor.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {citationRuleIds.length > 0 && (
        <div className="mt-4 rounded-xl border border-forge-gold/20 bg-forge-gold/5 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
            Why this session
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            Volume, rest, and recovery choices here are tied to evidence-backed
            rules — not guesswork.
          </p>
          <div className="mt-2">
            <EvidenceExplainerLink
              href={buildEvidenceHref({ related: citationRuleIds })}
              label={`See ${citationRuleIds.length} evidence rule${
                citationRuleIds.length === 1 ? "" : "s"
              }`}
            />
          </div>
        </div>
      )}
    </section>
  );
}
