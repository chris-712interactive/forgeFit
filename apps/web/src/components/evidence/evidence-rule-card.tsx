"use client";

import type { EvidenceRule } from "@forgefit/evidence-kb";
import { useEffect, useRef } from "react";
import {
  formatAppliesTo,
  formatRecommendationLines,
  getDomainLabel,
  getRuleSummary,
  getRuleTitle,
} from "@/lib/evidence/present";
import { EvidenceCitationList } from "./evidence-citation-list";
import { EvidenceConfidenceBadge } from "./evidence-confidence-badge";

interface EvidenceRuleCardProps {
  rule: EvidenceRule;
  highlighted?: boolean;
  applied?: boolean;
  defaultOpen?: boolean;
}

export function EvidenceRuleCard({
  rule,
  highlighted = false,
  applied = false,
  defaultOpen = false,
}: EvidenceRuleCardProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!highlighted && !defaultOpen) return;
    const node = detailsRef.current;
    if (!node) return;
    node.open = true;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted, defaultOpen]);

  const recommendationLines = formatRecommendationLines(rule.recommendation);
  const appliesTo = formatAppliesTo(rule.applies_to);

  return (
    <details
      ref={detailsRef}
      className={`group rounded-2xl border bg-forge-surface-raised transition-colors ${
        highlighted
          ? "border-forge-ember/50 ring-1 ring-forge-ember/20"
          : "border-[var(--border)]"
      }`}
    >
      <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
                {getDomainLabel(rule.domain)}
              </p>
              {applied && (
                <span className="rounded-full bg-forge-ember/10 px-2 py-0.5 text-[11px] font-semibold text-forge-ember">
                  In your plan
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-base font-semibold text-forge-text">
              {getRuleTitle(rule)}
            </h3>
            <p className="mt-1 text-sm text-forge-muted">{getRuleSummary(rule)}</p>
          </div>
          <EvidenceConfidenceBadge confidence={rule.confidence} />
        </div>
        <p className="mt-3 text-xs font-medium text-forge-steel group-open:hidden">
          Tap to view recommendation and sources
        </p>
      </summary>

      <div className="space-y-4 border-t border-[var(--border)] px-4 py-4 sm:px-5">
        {recommendationLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Recommendation
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-forge-text">
              {recommendationLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-forge-gold">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Applies when
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {appliesTo.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-forge-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Sources
          </p>
          <div className="mt-2">
            <EvidenceCitationList citations={rule.citations} />
          </div>
        </div>

        <p className="font-mono text-[11px] text-forge-muted">Rule ID: {rule.id}</p>
      </div>
    </details>
  );
}
