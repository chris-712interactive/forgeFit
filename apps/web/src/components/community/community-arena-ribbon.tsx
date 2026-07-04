"use client";

import { LeagueTierBackground } from "@/components/community/league-tier-background";
import type { GamificationContext, LeagueTier } from "@/lib/coaching/types";

interface CommunityArenaRibbonProps {
  gamification: GamificationContext;
}

const TIER_LABEL: Record<LeagueTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

const TIER_RANK_CLASS: Record<LeagueTier, string> = {
  bronze: "text-forge-ember",
  silver: "text-forge-steel",
  gold: "text-forge-gold",
};

const TIER_BADGE_CLASS: Record<LeagueTier, string> = {
  bronze: "border-amber-700/40 text-amber-200",
  silver: "border-slate-400/40 text-slate-200",
  gold: "border-forge-gold/40 text-forge-gold",
};

export function CommunityArenaRibbon({ gamification }: CommunityArenaRibbonProps) {
  const tier: LeagueTier = gamification.league?.tier ?? "bronze";
  const breakdown = gamification.habitBreakdown;
  const training = breakdown?.training ?? 0;
  const protein = breakdown?.nutrition ?? 0;
  const quality = breakdown?.quality ?? 0;
  const scoreTotal = breakdown?.score ?? gamification.userScore ?? 0;

  const chaseLabel =
    gamification.pointsToNextRank != null &&
    gamification.pointsToNextRank > 0 &&
    gamification.leaderAboveLabel
      ? `+${gamification.pointsToNextRank} to pass ${gamification.leaderAboveLabel}`
      : gamification.userRank === 1
        ? "Leading your tier"
        : null;

  return (
    <section className="relative overflow-hidden rounded p-3 sm:p-3.5">
      <LeagueTierBackground tier={tier} />

      <div className="relative z-10 flex items-center gap-3">
        <div
          className={`flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center bg-forge-surface/90 [clip-path:polygon(50%_0%,92%_18%,92%_72%,50%_100%,8%_72%,8%_18%)] border ${TIER_BADGE_CLASS[tier]}`}
        >
          <span className="text-[7px] font-semibold uppercase tracking-widest text-forge-muted">
            Rank
          </span>
          {gamification.userRank != null ? (
            <span
              className={`font-display text-lg font-bold leading-none tabular-nums ${TIER_RANK_CLASS[tier]}`}
            >
              #{gamification.userRank}
            </span>
          ) : (
            <span className="font-display text-lg font-bold text-forge-muted">—</span>
          )}
        </div>

        <div
          className="w-px self-stretch bg-[color-mix(in_srgb,var(--forge-ember)_28%,transparent)]"
          aria-hidden
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[1.35rem] font-bold leading-none tabular-nums text-forge-text">
                {Math.round(scoreTotal)}
              </span>
              <span className="text-[10px] text-forge-muted">habit score</span>
            </div>
            <span
              className={`shrink-0 rounded-full border bg-forge-surface/75 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${TIER_BADGE_CLASS[tier]}`}
            >
              {TIER_LABEL[tier]}
            </span>
          </div>

          {breakdown && (
            <>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-forge-surface">
                <div
                  className="h-full bg-forge-ember"
                  style={{ width: `${training}%` }}
                />
                <div
                  className="h-full bg-forge-gold"
                  style={{ width: `${protein}%` }}
                />
                <div
                  className="h-full bg-forge-success"
                  style={{ width: `${quality}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[9px] leading-tight">
                <span className="text-forge-muted">
                  Train {training} · Protein {protein} · Quality {quality}
                </span>
                {chaseLabel && (
                  <span className={`shrink-0 font-medium ${TIER_RANK_CLASS[tier]}`}>
                    {chaseLabel}
                  </span>
                )}
              </div>
            </>
          )}

          {!breakdown && chaseLabel && (
            <p className={`text-[10px] font-medium ${TIER_RANK_CLASS[tier]}`}>
              {chaseLabel}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
