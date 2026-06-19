"use client";

import { CommunityFollowButton } from "@/components/coaching/community-follow-button";
import type { FollowState, GamificationContext, LeaderboardEntryRow } from "@/lib/coaching/types";

interface CommunityStandingsListProps {
  gamification: GamificationContext;
  entries: LeaderboardEntryRow[];
  totalRanked: number;
  followState: Record<string, FollowState>;
}

export function CommunityStandingsList({
  gamification,
  entries,
  totalRanked,
  followState,
}: CommunityStandingsListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
        <p className="text-sm font-medium text-forge-text">No scores yet</p>
        <p className="mt-1 text-xs text-forge-muted">
          {gamification.optedIn
            ? "Log workouts and hit protein targets to climb the board."
            : "Be the first in your tier once you join."}
        </p>
      </div>
    );
  }

  const tierLabel = gamification.league?.tierLabel ?? "your";

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          {tierLabel} tier standings
        </h3>
        <span className="text-xs text-forge-muted">{totalRanked} ranked</span>
      </div>

      <ol className="space-y-2">
        {entries.map((entry, index) => {
          const state: FollowState = followState[entry.userId] ?? {
            following: false,
            isMutual: false,
          };
          const isTopThree = index < 3;

          return (
            <li
              key={entry.userId}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                entry.isCurrentUser
                  ? "border-forge-gold/45 bg-forge-gold/5"
                  : "border-[var(--border)] bg-forge-surface/50"
              }`}
            >
              <span
                className={`font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                  isTopThree
                    ? "bg-forge-gold/15 text-forge-gold"
                    : "bg-forge-surface-raised text-forge-muted"
                }`}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${
                    entry.isCurrentUser
                      ? "font-semibold text-forge-gold"
                      : "font-medium text-forge-text"
                  }`}
                >
                  {entry.displayLabel}
                  {entry.isCurrentUser ? " · you" : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="font-display text-base font-bold tabular-nums text-forge-text">
                  {entry.habitScore}
                </span>
                {gamification.optedIn && !entry.isCurrentUser && (
                  <CommunityFollowButton
                    userId={entry.userId}
                    initialState={state}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
