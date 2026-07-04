"use client";

import type { WeeklyRivalRow } from "@/lib/coaching/types";

interface CommunityRivalShowdownProps {
  rival: WeeklyRivalRow;
  userRank: number | null;
  userScore: number | null;
}

export function CommunityRivalShowdown({
  rival,
  userRank,
  userScore,
}: CommunityRivalShowdownProps) {
  const you = userScore ?? 0;
  const them = rival.habitScore;
  const total = Math.max(1, you + them);
  const youPct = Math.round((you / total) * 100);

  const message = rival.isAhead ? (
    <>
      {rival.displayLabel} is {rival.pointsGap} pts ahead.
      {userRank != null && rival.rank < userRank
        ? " Log your next workout to close the gap before the week ends."
        : null}
    </>
  ) : (
    <>
      You are {rival.pointsGap} pts ahead — keep the pressure on before they
      respond.
    </>
  );

  return (
    <section className="rounded-2xl border border-forge-ember/30 bg-forge-ember/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-ember">
          Rival of the week
        </p>
        <span className="rounded-full border border-forge-ember/35 bg-forge-surface/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forge-ember">
          Live
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold text-forge-text">You</p>
          <p className="font-display text-3xl font-bold leading-none tabular-nums text-forge-text">
            {you}
          </p>
          {userRank != null && (
            <p className="text-[10px] text-forge-muted">#{userRank}</p>
          )}
        </div>

        <p className="px-1 text-sm font-bold text-forge-muted">vs</p>

        <div className="flex flex-1 flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold text-forge-text">
            {rival.displayLabel}
          </p>
          <p className="font-display text-3xl font-bold leading-none tabular-nums text-forge-gold">
            {them}
          </p>
          <p className="text-[10px] text-forge-muted">#{rival.rank}</p>
        </div>
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        <div
          className="h-full bg-forge-ember"
          style={{ width: `${youPct}%` }}
        />
        <div className="h-full flex-1 bg-forge-gold/80" />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-forge-text">{message}</p>
    </section>
  );
}
