import type { GamificationContext } from "@/lib/coaching/types";

interface LeaderboardCardProps {
  gamification: GamificationContext;
}

export function LeaderboardCard({ gamification }: LeaderboardCardProps) {
  if (!gamification.unlocked || !gamification.optedIn) {
    return null;
  }

  const bucketLabel = "your goal & experience";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Weekly leaderboard
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Habit score from training, protein, and session quality — bucketed by{" "}
            {bucketLabel}
          </p>
        </div>
        {gamification.userScore != null && gamification.userRank != null && (
          <div className="rounded-xl border border-forge-gold/35 bg-forge-surface px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-forge-muted">
              You
            </p>
            <p className="font-display text-xl font-bold text-forge-gold">
              #{gamification.userRank}
            </p>
            <p className="text-xs text-forge-muted">{gamification.userScore} pts</p>
          </div>
        )}
      </div>

      {!gamification.tableReady && (
        <p className="mt-3 rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-xs text-forge-muted">
          Apply the Phase 8 gamification migration to enable leaderboards.
        </p>
      )}

      {gamification.tableReady && gamification.leaderboard.length === 0 && (
        <p className="mt-4 text-sm text-forge-muted">
          No scores yet this week — log workouts and nutrition to climb the board.
        </p>
      )}

      {gamification.leaderboard.length > 0 && (
        <ol className="mt-4 space-y-2">
          {gamification.leaderboard.map((entry, index) => (
            <li
              key={entry.userId}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                entry.isCurrentUser
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
                    entry.isCurrentUser
                      ? "font-semibold text-forge-gold"
                      : "text-forge-text"
                  }`}
                >
                  {entry.displayLabel}
                  {entry.isCurrentUser ? " (you)" : ""}
                </span>
              </div>
              <span className="text-sm font-medium text-forge-text">
                {entry.habitScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
