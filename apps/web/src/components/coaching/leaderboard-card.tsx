import type { GamificationContext } from "@/lib/coaching/types";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";

interface LeaderboardCardProps {
  gamification: GamificationContext;
  embedded?: boolean;
  preview?: boolean;
}

export function LeaderboardCard({
  gamification,
  embedded = false,
  preview = false,
}: LeaderboardCardProps) {
  if (!gamification.unlocked) {
    return null;
  }

  const bucketCopy =
    gamification.bucketLabel ?? "your goal & experience level";

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {!embedded && (
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              Weekly leaderboard
            </h2>
          )}
          <p className={`text-xs text-forge-muted ${embedded ? "" : "mt-1"}`}>
            Habit score — {bucketCopy}
            {gamification.league
              ? ` · ${gamification.league.tierLabel} league`
              : ""}
            {preview ? " · preview" : ""}
          </p>
        </div>
        {!preview &&
          gamification.userScore != null &&
          gamification.userRank != null && (
            <div className="rounded-xl border border-forge-gold/35 bg-forge-surface px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-wide text-forge-muted">
                You
              </p>
              <p className="font-display text-xl font-bold text-forge-gold">
                #{gamification.userRank}
              </p>
              <p className="text-xs text-forge-muted">
                {gamification.userScore} pts
              </p>
            </div>
          )}
      </div>

      {!gamification.tableReady && (
        <p className="mt-3 rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          {FEATURE_TEMPORARILY_UNAVAILABLE}
        </p>
      )}

      {gamification.tableReady && gamification.leaderboard.length === 0 && (
        <p className="mt-4 text-sm text-forge-muted">
          {preview
            ? "No one has posted a score this week yet. Be the first in your bucket once you join."
            : "No scores yet this week — log workouts and nutrition to climb the board."}
        </p>
      )}

      {gamification.leaderboard.length > 0 && (
        <ol className="mt-4 space-y-2">
          {gamification.leaderboard.map((entry, index) => (
            <li
              key={entry.userId}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                entry.isCurrentUser && !preview
                  ? "border-forge-gold/40 bg-forge-surface"
                  : "border-[var(--border)] bg-forge-surface/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-display w-6 text-sm font-bold text-forge-muted">
                  {index + 1}
                </span>
                <span
                  className={`text-sm ${
                    entry.isCurrentUser && !preview
                      ? "font-semibold text-forge-gold"
                      : "text-forge-text"
                  }`}
                >
                  {entry.displayLabel}
                  {entry.isCurrentUser && !preview ? " (you)" : ""}
                </span>
              </div>
              <span className="text-sm font-medium text-forge-text">
                {entry.habitScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      {content}
    </section>
  );
}
