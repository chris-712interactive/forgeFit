"use client";

import { LeagueTierBackground } from "@/components/community/league-tier-background";
import type { GamificationContext, HabitScoreBreakdown, LeagueTier } from "@/lib/coaching/types";
import { useCallback, useRef, useState } from "react";

interface CommunityArenaRibbonProps {
  gamification: GamificationContext;
}

type ArenaSlide = "week" | "season";

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

interface ArenaPanelProps {
  tier: LeagueTier;
  banner: string;
  bannerClassName: string;
  rankLabel: string;
  rank: number | null;
  score: number | null;
  scoreLabel: string;
  breakdown: HabitScoreBreakdown | null;
  chaseLabel: string | null;
}

function ArenaRibbonPanel({
  tier,
  banner,
  bannerClassName,
  rankLabel,
  rank,
  score,
  scoreLabel,
  breakdown,
  chaseLabel,
}: ArenaPanelProps) {
  const training = breakdown?.training ?? 0;
  const protein = breakdown?.nutrition ?? 0;
  const quality = breakdown?.quality ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded px-3 pb-3 pt-0 sm:px-3.5 sm:pb-3.5"
      aria-label={`${banner} league standing`}
    >
      <LeagueTierBackground tier={tier} />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 border-b border-[color-mix(in_srgb,var(--forge-steel)_20%,transparent)] py-1.5">
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${bannerClassName}`}
          >
            {banner}
          </p>
          <span
            className={`shrink-0 rounded-full border bg-forge-surface/75 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${TIER_BADGE_CLASS[tier]}`}
          >
            {TIER_LABEL[tier]}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-3">
          <div
            className={`flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center bg-forge-surface/90 [clip-path:polygon(50%_0%,92%_18%,92%_72%,50%_100%,8%_72%,8%_18%)] border ${TIER_BADGE_CLASS[tier]}`}
          >
            <span className="text-[7px] font-semibold uppercase tracking-widest text-forge-muted">
              {rankLabel}
            </span>
            {rank != null ? (
              <span
                className={`font-display text-lg font-bold leading-none tabular-nums ${TIER_RANK_CLASS[tier]}`}
              >
                #{rank}
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
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[1.35rem] font-bold leading-none tabular-nums text-forge-text">
                {score != null ? Math.round(score) : "—"}
              </span>
              <span className="text-[10px] text-forge-muted">{scoreLabel}</span>
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
      </div>
    </section>
  );
}

const SWIPE_THRESHOLD_PX = 48;

export function CommunityArenaRibbon({ gamification }: CommunityArenaRibbonProps) {
  const tier: LeagueTier = gamification.league?.tier ?? "bronze";
  const breakdown = gamification.habitBreakdown;
  const season = gamification.league?.seasonStanding ?? null;

  const [slide, setSlide] = useState<ArenaSlide>("week");
  const touchStartX = useRef<number | null>(null);

  const weekChaseLabel =
    gamification.pointsToNextRank != null &&
    gamification.pointsToNextRank > 0 &&
    gamification.leaderAboveLabel
      ? `+${gamification.pointsToNextRank} to pass ${gamification.leaderAboveLabel}`
      : gamification.userRank === 1
        ? "Leading your tier"
        : null;

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback((event: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;

    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    if (delta < 0) {
      setSlide("season");
    } else {
      setSlide("week");
    }
  }, []);

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex w-[200%] transition-transform duration-300 ease-out"
          style={{
            transform: slide === "week" ? "translateX(0%)" : "translateX(-50%)",
          }}
        >
          <div className="box-border w-1/2 shrink-0">
            <ArenaRibbonPanel
              tier={tier}
              banner="This week"
              bannerClassName="text-forge-ember"
              rankLabel="Rank"
              rank={gamification.userRank}
              score={breakdown?.score ?? gamification.userScore}
              scoreLabel="habit score"
              breakdown={breakdown}
              chaseLabel={weekChaseLabel}
            />
          </div>
          <div className="box-border w-1/2 shrink-0">
            <ArenaRibbonPanel
              tier={tier}
              banner="This season"
              bannerClassName="text-forge-gold"
              rankLabel="Avg rank"
              rank={season?.avgRank ?? null}
              score={season?.avgHabitScore ?? null}
              scoreLabel="avg score"
              breakdown={breakdown}
              chaseLabel={season?.chaseLabel ?? null}
            />
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-1.5"
        role="tablist"
        aria-label="Arena period"
      >
        {(["week", "season"] as const).map((key) => {
          const active = slide === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={key === "week" ? "This week" : "This season"}
              onClick={() => setSlide(key)}
              className={`h-1.5 rounded-full transition-all ${
                active
                  ? key === "week"
                    ? "w-[18px] bg-forge-ember"
                    : "w-[18px] bg-forge-gold"
                  : "w-1.5 bg-[var(--border)]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
