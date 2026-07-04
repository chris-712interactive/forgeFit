"use client";

import { winTypeLabel } from "@/lib/coaching/community-labels";
import type { CommunityWinRow } from "@/lib/coaching/types";

interface CommunityActivityPulseProps {
  activePeerCount: number;
  latestWin: CommunityWinRow | null;
}

export function CommunityActivityPulse({
  activePeerCount,
  latestWin,
}: CommunityActivityPulseProps) {
  if (activePeerCount <= 0 && !latestWin) {
    return null;
  }

  const winLine = latestWin
    ? `${latestWin.displayLabel} — ${winTypeLabel(latestWin.winType)}`
    : null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2">
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forge-success"
          aria-hidden
        />
        <p className="text-[11px] leading-relaxed text-forge-muted">
          {activePeerCount > 0 && (
            <span>
              {activePeerCount} active in your bucket this week
              {winLine ? " · " : ""}
            </span>
          )}
          {winLine && <span>{winLine}</span>}
        </p>
      </div>
    </section>
  );
}
