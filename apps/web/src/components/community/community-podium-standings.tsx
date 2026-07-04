"use client";

import { CommunityFollowButton } from "@/components/coaching/community-follow-button";
import type {
  FollowState,
  GamificationContext,
  LeaderboardEntryRow,
} from "@/lib/coaching/types";
import { useMemo, useState } from "react";

interface CommunityPodiumStandingsProps {
  gamification: GamificationContext;
  entries: LeaderboardEntryRow[];
  totalRanked: number;
  followState: Record<string, FollowState>;
}

const PODIUM_HEIGHT = { 1: 68, 2: 52, 3: 44 } as const;

export function CommunityPodiumStandings({
  gamification,
  entries,
  totalRanked,
  followState,
}: CommunityPodiumStandingsProps) {
  const [expanded, setExpanded] = useState(false);

  const podiumOrder = useMemo(() => {
    const top = entries.slice(0, 3).map((entry, index) => ({
      entry,
      rank: index + 1,
    }));
    if (top.length < 3) return top;
    return [top[1], top[0], top[2]];
  }, [entries]);

  const listEntries = entries.slice(3, expanded ? entries.length : 6);
  const tierLabel = gamification.league?.tierLabel ?? "Your";

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
        <p className="text-sm font-medium text-forge-text">No scores yet</p>
        <p className="mt-1 text-xs text-forge-muted">
          {gamification.optedIn
            ? "Log workouts and hit protein targets to climb the board."
            : "Be the first in your tier once you join."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          {tierLabel} tier standings
        </h3>
        <span className="text-xs text-forge-muted">{totalRanked} ranked</span>
      </div>

      {podiumOrder.length >= 2 && (
        <div className="flex items-end justify-center gap-2 px-1 pt-2">
          {podiumOrder.map(({ entry, rank }) => {
            const isFirst = rank === 1;
            const height = PODIUM_HEIGHT[rank as 1 | 2 | 3] ?? 40;

            return (
              <div
                key={entry.userId}
                className="flex w-[4.5rem] flex-col items-center gap-1"
              >
                <p
                  className={`max-w-full truncate text-center text-[10px] font-semibold sm:text-xs ${
                    isFirst ? "text-forge-gold" : "text-forge-muted"
                  }`}
                >
                  {entry.displayLabel}
                  {entry.isCurrentUser ? " · you" : ""}
                </p>
                <p className="font-display text-sm font-bold tabular-nums text-forge-text">
                  {entry.habitScore}
                </p>
                <div
                  className={`flex w-full items-start justify-center rounded-t-lg border pt-1.5 ${
                    isFirst
                      ? "border-forge-gold/45 bg-forge-gold/10"
                      : "border-[var(--border)] bg-forge-surface-raised"
                  }`}
                  style={{ height }}
                >
                  <span
                    className={`font-display text-base font-bold ${
                      isFirst ? "text-forge-gold" : "text-forge-muted"
                    }`}
                  >
                    {rank}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {listEntries.length > 0 && (
        <ol className="space-y-2">
          {listEntries.map((entry) => {
            const rank = entries.indexOf(entry) + 1;
            const state: FollowState = followState[entry.userId] ?? {
              following: false,
              isMutual: false,
            };

            return (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                  entry.isCurrentUser
                    ? "border-forge-gold/45 bg-forge-gold/5"
                    : "border-[var(--border)] bg-forge-surface/50"
                }`}
              >
                <span
                  className={`font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    entry.isCurrentUser
                      ? "bg-forge-gold/15 text-forge-gold"
                      : "bg-forge-surface-raised text-forge-muted"
                  }`}
                >
                  {rank}
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
      )}

      {entries.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full text-center text-xs font-medium text-forge-steel underline-offset-2 hover:underline"
        >
          {expanded ? "Show less" : `View full standings (${entries.length})`}
        </button>
      )}
    </section>
  );
}
