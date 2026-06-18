import type { LeaderboardRankDelta } from "@/lib/coaching/types";
import Link from "next/link";

interface WorkoutRankDeltaCardProps {
  rankDelta: LeaderboardRankDelta;
}

export function WorkoutRankDeltaCard({ rankDelta }: WorkoutRankDeltaCardProps) {
  const improved =
    rankDelta.rankChange != null && rankDelta.rankChange > 0;
  const declined =
    rankDelta.rankChange != null && rankDelta.rankChange < 0;
  const unchanged =
    rankDelta.rankChange === 0 ||
    (rankDelta.previousRank != null &&
      rankDelta.newRank != null &&
      rankDelta.previousRank === rankDelta.newRank);

  return (
    <section className="mt-6 rounded-2xl border border-forge-gold/35 bg-forge-gold/5 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        Community rank
      </p>

      {rankDelta.newRank == null ? (
        <p className="mt-2 text-sm text-forge-muted">
          Complete more workouts and nutrition this week to join your bucket
          leaderboard.
        </p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <p className="font-display text-3xl font-bold text-forge-gold">
              #{rankDelta.newRank}
            </p>
            {rankDelta.newScore != null && (
              <p className="pb-1 text-sm text-forge-muted">
                {rankDelta.newScore} habit pts
              </p>
            )}
            {improved && (
              <span className="rounded-full bg-forge-success/15 px-2.5 py-1 text-xs font-semibold text-forge-success">
                ↑ {rankDelta.rankChange} place
                {rankDelta.rankChange === 1 ? "" : "s"}
              </span>
            )}
            {declined && (
              <span className="rounded-full bg-forge-coral/15 px-2.5 py-1 text-xs font-semibold text-forge-coral">
                ↓ {Math.abs(rankDelta.rankChange!)} place
                {Math.abs(rankDelta.rankChange!) === 1 ? "" : "s"}
              </span>
            )}
            {unchanged && rankDelta.previousRank != null && (
              <span className="rounded-full bg-forge-surface px-2.5 py-1 text-xs font-semibold text-forge-muted">
                Holding #{rankDelta.newRank}
              </span>
            )}
          </div>

          {rankDelta.previousRank != null &&
            rankDelta.newRank != null &&
            rankDelta.previousRank !== rankDelta.newRank && (
              <p className="mt-2 text-sm text-forge-muted">
                Was #{rankDelta.previousRank}
                {rankDelta.previousScore != null &&
                  rankDelta.newScore != null &&
                  rankDelta.newScore !== rankDelta.previousScore &&
                  ` · score ${rankDelta.previousScore} → ${rankDelta.newScore}`}
              </p>
            )}

          {rankDelta.pointsToNextRank != null &&
            rankDelta.pointsToNextRank > 0 &&
            rankDelta.leaderAboveLabel && (
              <p className="mt-2 text-sm text-forge-text">
                {rankDelta.pointsToNextRank} pts to pass{" "}
                {rankDelta.leaderAboveLabel}
              </p>
            )}
        </>
      )}

      <Link
        href="/community"
        className="mt-3 inline-block text-sm font-medium text-forge-ember underline-offset-2 hover:underline"
      >
        View full leaderboard →
      </Link>
    </section>
  );
}
