"use client";

import { setGamificationOptIn } from "@/app/actions/gamification";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { LeagueTierBadge } from "@/components/coaching/league-tier-badge";
import type { GamificationContext } from "@/lib/coaching/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityHeroProps {
  gamification: GamificationContext;
  variant?: "default" | "compact";
}

export function CommunityHero({
  gamification,
  variant = "default",
}: CommunityHeroProps) {
  const compact = variant === "compact";
  const shellClass = compact
    ? "relative overflow-hidden rounded-2xl border border-forge-gold/20 bg-gradient-to-br from-forge-surface-raised via-[#1a1410] to-forge-ember/15 p-4"
    : "relative overflow-hidden rounded-3xl border border-forge-gold/20 bg-gradient-to-br from-forge-surface-raised via-[#1a1410] to-forge-ember/15 p-5 sm:p-6";
  const rankClass = compact
    ? "font-display text-5xl font-bold leading-none tabular-nums text-forge-text"
    : "font-display text-6xl font-bold leading-none tabular-nums text-forge-text sm:text-7xl";
  const scoreClass = compact
    ? "font-display text-2xl font-bold tabular-nums text-forge-gold"
    : "font-display text-3xl font-bold tabular-nums text-forge-gold";
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOptIn() {
    setSaving(true);
    setError(null);
    const result = await setGamificationOptIn(true);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not join community.");
      return;
    }
    router.refresh();
  }

  if (!gamification.unlocked) {
    return (
      <section
        className={
          compact
            ? "relative overflow-hidden rounded-2xl border border-forge-ember/25 bg-gradient-to-br from-forge-surface-raised via-forge-surface to-forge-ember/10 p-4"
            : "relative overflow-hidden rounded-3xl border border-forge-ember/25 bg-gradient-to-br from-forge-surface-raised via-forge-surface to-forge-ember/10 p-5 sm:p-6"
        }
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-forge-ember/15 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-forge-ember">
          Pro community
        </p>
        <h2 className={`font-display font-bold text-forge-text ${compact ? "text-lg" : "mt-2 text-2xl"}`}>
          Train with your bucket
        </h2>
        {!compact && (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-forge-muted">
            Weekly habit scores, rivals, and leagues — matched to your goal and
            experience so comparisons stay fair.
          </p>
        )}
        <div className={compact ? "mt-3" : "mt-4"}>
          <UpgradePrompt
            title="Unlock community"
            description="Pro includes leaderboards, weekly rivals, crews, and monthly leagues."
            suggestedTier="pro"
          />
        </div>
      </section>
    );
  }

  if (!gamification.bucketLabel) {
    return (
      <section
        className={
          compact
            ? "rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
            : "rounded-3xl border border-[var(--border)] bg-forge-surface-raised p-5 sm:p-6"
        }
      >
        <p className="font-display text-lg font-semibold text-forge-text">
          Finish your profile
        </p>
        <p className="mt-2 text-sm text-forge-muted">
          Set your goal and experience level to find your community bucket.
        </p>
      </section>
    );
  }

  const league = gamification.league;
  const hasRank =
    gamification.optedIn &&
    gamification.userRank != null &&
    gamification.userScore != null;
  const chasing =
    gamification.pointsToNextRank != null &&
    gamification.pointsToNextRank > 0 &&
    gamification.leaderAboveLabel;

  return (
    <section className={shellClass}>
      <div className="pointer-events-none absolute -left-10 top-0 h-36 w-36 rounded-full bg-forge-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-forge-ember/20 blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {league && gamification.optedIn ? (
            <LeagueTierBadge
              tier={league.tier}
              label={`${league.tierLabel} league`}
              size="md"
            />
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-forge-muted">
              {gamification.bucketLabel}
            </p>
          )}
          <p className="mt-2 text-xs text-forge-muted">
            {gamification.bucketLabel}
            {gamification.optedIn && league
              ? ` · ${league.tierPeerCount} in your tier this week`
              : gamification.activePeerCount > 0
                ? ` · ${gamification.activePeerCount} active this week`
                : ""}
          </p>
        </div>

        {gamification.optedIn && gamification.userScore != null && (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-forge-muted">
              Habit score
            </p>
            <p className={scoreClass}>
              {gamification.userScore}
            </p>
          </div>
        )}
      </div>

      <div className={`relative flex items-end gap-4 ${compact ? "mt-4" : "mt-6"}`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-forge-muted">
            Your rank
          </p>
          {hasRank ? (
            <p className={rankClass}>#{gamification.userRank}</p>
          ) : (
            <p className={`mt-1 font-display font-bold text-forge-muted ${compact ? "text-2xl" : "text-3xl"}`}>
              —
            </p>
          )}
          {!gamification.optedIn && (
            <p className="mt-2 text-sm text-forge-muted">Preview mode</p>
          )}
          {gamification.optedIn && !hasRank && (
            <p className="mt-2 text-sm text-forge-muted">
              Log workouts & nutrition to appear on the board
            </p>
          )}
        </div>
      </div>

      {chasing && gamification.optedIn && (
        <div className={`relative rounded-2xl border border-forge-gold/35 bg-forge-surface/80 px-3 py-2.5 backdrop-blur-sm ${compact ? "mt-3" : "mt-5"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-gold">
                Next target
              </p>
              <p className="truncate text-sm font-medium text-forge-text">
                Pass {gamification.leaderAboveLabel}
              </p>
            </div>
            <p className="shrink-0 font-display text-2xl font-bold tabular-nums text-forge-gold">
              +{gamification.pointsToNextRank}
            </p>
          </div>
        </div>
      )}

      {gamification.optedIn &&
        hasRank &&
        gamification.userRank === 1 && (
          <p className="relative mt-4 text-sm font-medium text-forge-gold">
            You&apos;re leading your tier this week — defend the top spot.
          </p>
        )}

      {!gamification.optedIn && (
        <div className={`relative rounded-2xl border border-forge-ember/30 bg-forge-ember/10 px-4 py-3 ${compact ? "mt-3" : "mt-5"}`}>
          <p className="text-sm font-medium text-forge-text">
            Join to compete on the board
          </p>
          {!compact && (
            <p className="mt-1 text-xs leading-relaxed text-forge-muted">
              First name only. Share your weekly score, find rivals, and cheer
              wins.
            </p>
          )}
          {error && (
            <p className="mt-2 text-xs text-forge-coral">{error}</p>
          )}
          <button
            type="button"
            onClick={() => void handleOptIn()}
            disabled={saving}
            className={`mt-3 rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${compact ? "w-full" : "w-full sm:w-auto"}`}
          >
            {saving ? "Joining…" : "Join community"}
          </button>
        </div>
      )}

      {league && league.badges.length > 0 && gamification.optedIn && !compact && (
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {league.badges.slice(0, 4).map((badge) => (
            <span
              key={`${badge.badgeKey}-${badge.seasonMonth ?? "lifetime"}`}
              className="rounded-full border border-forge-gold/25 bg-forge-gold/10 px-2.5 py-0.5 text-[10px] font-medium text-forge-gold"
            >
              {badgeLabel(badge.badgeKey)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function badgeLabel(key: string): string {
  switch (key) {
    case "league_silver":
      return "Silver";
    case "league_gold":
      return "Gold";
    case "season_champion":
      return "Champion";
    case "season_podium":
      return "Podium";
    case "season_promoted":
      return "Promoted";
    default:
      return key;
  }
}
