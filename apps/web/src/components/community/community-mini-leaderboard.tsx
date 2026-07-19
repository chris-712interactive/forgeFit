import type { GamificationContext, LeaderboardEntryRow } from "@/lib/coaching/types";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";
import Link from "next/link";

interface CommunityMiniLeaderboardProps {
  gamification: GamificationContext;
  entries: LeaderboardEntryRow[];
  limit?: number;
}

export function CommunityMiniLeaderboard({
  gamification,
  entries,
  limit = 5,
}: CommunityMiniLeaderboardProps) {
  const visible = entries.slice(0, limit);
  const tierLabel = gamification.league?.tierLabel ?? "your";

  if (!gamification.tableReady) {
    return (
      <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
        {FEATURE_TEMPORARILY_UNAVAILABLE}
      </p>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="text-sm text-forge-muted">
        {gamification.optedIn
          ? "No tier scores yet this week."
          : "Preview your bucket — join to compete."}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          Top {tierLabel} tier
        </h3>
        {entries.length > limit && (
          <Link
            href="/community"
            className="text-xs font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            See all
          </Link>
        )}
      </div>

      <ol className="space-y-1.5">
        {visible.map((entry, index) => {
          const isTopThree = index < 3;
          return (
            <li
              key={entry.userId}
              className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${
                entry.isCurrentUser && gamification.optedIn
                  ? "border-forge-gold/45 bg-forge-gold/5"
                  : "border-[var(--border)] bg-forge-surface/40"
              }`}
            >
              <span
                className={`font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isTopThree
                    ? "bg-forge-gold/15 text-forge-gold"
                    : "bg-forge-surface-raised text-forge-muted"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  entry.isCurrentUser && gamification.optedIn
                    ? "font-semibold text-forge-gold"
                    : "text-forge-text"
                }`}
              >
                {entry.displayLabel}
                {entry.isCurrentUser && gamification.optedIn ? " · you" : ""}
              </span>
              <span className="shrink-0 font-display text-sm font-bold tabular-nums text-forge-text">
                {entry.habitScore}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
