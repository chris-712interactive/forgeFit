"use client";

import { getCommunityWeekCountdown } from "@/lib/coaching/community-week-countdown";
import { useMemo } from "react";

export function CommunityWeekCountdownBar() {
  const { daysLeft, progressPct, endLabel } = useMemo(
    () => getCommunityWeekCountdown(),
    []
  );

  return (
    <section className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-forge-ember">
          Week ends {endLabel}
        </p>
        <p className="text-[11px] text-forge-muted">
          {daysLeft === 0 ? "Final day" : `${daysLeft}d left`}
        </p>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-forge-surface">
        <div
          className="h-full rounded-full bg-forge-ember transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </section>
  );
}
