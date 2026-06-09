"use client";

import type { EvidenceRule } from "@forgefit/evidence-kb";
import { useEffect, useMemo, useState } from "react";
import { DOMAIN_LABELS, getDomainLabel } from "@/lib/evidence/present";
import { EvidenceRuleCard } from "./evidence-rule-card";

type EvidenceView = "yours" | "all";

interface EvidenceBrowserProps {
  appliedRuleIds: string[];
  allRules: EvidenceRule[];
  focusRuleId?: string;
  relatedRuleIds?: string[];
}

export function EvidenceBrowser({
  appliedRuleIds,
  allRules,
  focusRuleId,
  relatedRuleIds = [],
}: EvidenceBrowserProps) {
  const [view, setView] = useState<EvidenceView>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  useEffect(() => {
    if (appliedRuleIds.length > 0) {
      setView("yours");
    }
  }, [appliedRuleIds.length]);

  const appliedSet = useMemo(() => new Set(appliedRuleIds), [appliedRuleIds]);
  const highlightIds = useMemo(
    () => new Set([focusRuleId, ...relatedRuleIds].filter(Boolean) as string[]),
    [focusRuleId, relatedRuleIds]
  );

  const visibleRules = useMemo(() => {
    const base =
      view === "yours"
        ? allRules.filter((rule) => appliedSet.has(rule.id))
        : allRules;

    if (domainFilter === "all") return base;
    return base.filter((rule) => rule.domain === domainFilter);
  }, [allRules, appliedSet, domainFilter, view]);

  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rule of visibleRules) {
      counts.set(rule.domain, (counts.get(rule.domain) ?? 0) + 1);
    }
    return counts;
  }, [visibleRules]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label={`Your plan (${appliedRuleIds.length})`}
          selected={view === "yours"}
          onClick={() => setView("yours")}
        />
        <FilterChip
          label={`Full library (${allRules.length})`}
          selected={view === "all"}
          onClick={() => setView("all")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All domains"
          selected={domainFilter === "all"}
          onClick={() => setDomainFilter("all")}
        />
        {Object.entries(DOMAIN_LABELS).map(([domain, label]) => {
          const count =
            view === "yours"
              ? allRules.filter(
                  (rule) => appliedSet.has(rule.id) && rule.domain === domain
                ).length
              : allRules.filter((rule) => rule.domain === domain).length;
          if (count === 0) return null;
          return (
            <FilterChip
              key={domain}
              label={`${label} (${count})`}
              selected={domainFilter === domain}
              onClick={() => setDomainFilter(domain)}
            />
          );
        })}
      </div>

      {visibleRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
          {view === "yours"
            ? "Generate your program to see which evidence rules power your plan."
            : "No rules match this filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {renderRuleGroups(visibleRules, {
            groupByDomain: view === "all" && domainFilter === "all",
            appliedSet,
            highlightIds,
          })}
        </div>
      )}

      {visibleRules.length > 0 && (
        <p className="text-xs text-forge-muted">
          {view === "yours"
            ? `Your plan applies ${visibleRules.length} evidence ${
                visibleRules.length === 1 ? "rule" : "rules"
              } across ${domainCounts.size} ${
                domainCounts.size === 1 ? "domain" : "domains"
              }.`
            : `Showing ${visibleRules.length} ${
                domainFilter === "all" ? "" : `${getDomainLabel(domainFilter as never)} `
              }${visibleRules.length === 1 ? "rule" : "rules"}.`}
        </p>
      )}
    </div>
  );
}

function renderRuleGroups(
  rules: EvidenceRule[],
  options: {
    groupByDomain: boolean;
    appliedSet: Set<string>;
    highlightIds: Set<string>;
  }
) {
  if (!options.groupByDomain) {
    return rules.map((rule) => (
      <EvidenceRuleCard
        key={rule.id}
        rule={rule}
        applied={options.appliedSet.has(rule.id)}
        highlighted={options.highlightIds.has(rule.id)}
        defaultOpen={options.highlightIds.has(rule.id)}
      />
    ));
  }

  return Object.keys(DOMAIN_LABELS).flatMap((domain) => {
    const grouped = rules.filter((rule) => rule.domain === domain);
    if (grouped.length === 0) return [];

    return (
      <div key={domain} className="space-y-3">
        <h2 className="pt-2 font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          {getDomainLabel(domain as keyof typeof DOMAIN_LABELS)}
        </h2>
        {grouped.map((rule) => (
          <EvidenceRuleCard
            key={rule.id}
            rule={rule}
            applied={options.appliedSet.has(rule.id)}
            highlighted={options.highlightIds.has(rule.id)}
            defaultOpen={options.highlightIds.has(rule.id)}
          />
        ))}
      </div>
    );
  });
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        selected
          ? "border-forge-ember bg-forge-ember/10 text-forge-ember"
          : "border-[var(--border)] text-forge-muted hover:border-forge-ember/40"
      }`}
    >
      {label}
    </button>
  );
}
