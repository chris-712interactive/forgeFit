"use client";

import { CommunityWinCheerButton } from "@/components/coaching/community-win-cheer-button";
import {
  formatCommunityWinDetail,
  winTypeLabel,
} from "@/lib/coaching/community-labels";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import type { CommunityWinRow } from "@/lib/coaching/types";

interface CrewWinsFeedProps {
  wins: CommunityWinRow[];
}

export function CrewWinsFeed({ wins }: CrewWinsFeedProps) {
  const unit = useUnitPreference();

  if (wins.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Crew feed
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Wins from your crew will show up here when members complete plans, hit
          streaks, or set PRs.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Crew feed
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Recent wins from your crew members
      </p>

      <ul className="mt-4 space-y-3">
        {wins.map((win) => (
          <li
            key={win.id}
            className="rounded-xl border border-[var(--border)] bg-forge-surface/60 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-forge-ember">
                  {winTypeLabel(win.winType)} · {win.displayLabel}
                </p>
                <p className="mt-1 text-sm font-medium text-forge-text">
                  {win.headline}
                </p>
                {win.detail && (
                  <p className="mt-1 text-xs text-forge-muted">
                    {formatCommunityWinDetail(win.detail, unit)}
                  </p>
                )}
              </div>
              <CommunityWinCheerButton
                winId={win.id}
                initialCheered={win.cheeredByMe}
                initialCount={win.cheerCount}
                disabled={win.isCurrentUser}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
