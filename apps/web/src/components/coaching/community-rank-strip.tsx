import type { CommunityRankSnapshot } from "@/lib/coaching/types";
import Link from "next/link";
import { WeeklyRivalCard } from "@/components/coaching/weekly-rival-card";

interface CommunityRankStripProps {
  rank: CommunityRankSnapshot;
}

export function CommunityRankStrip({ rank }: CommunityRankStripProps) {
  if (!rank.unlocked) {
    return null;
  }

  if (!rank.optedIn) {
    return (
      <div className="rounded-xl border border-forge-gold/25 bg-forge-gold/5 px-4 py-3">
        <p className="text-sm font-medium text-forge-text">
          Community leaderboard
        </p>
        <p className="mt-1 text-xs text-forge-muted">
          {rank.activePeerCount > 0
            ? `${rank.activePeerCount} athletes active in ${rank.bucketLabel ?? "your bucket"} this week.`
            : "Join your bucket to compete on weekly habit scores."}{" "}
          <Link
            href="/community"
            className="font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            View community
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rank.weeklyRival && (
        <WeeklyRivalCard
          rival={rank.weeklyRival}
          userRank={rank.userRank}
          compact
        />
      )}

      <div className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-gold">
            Your bucket rank
          </p>
          <p className="mt-1 text-sm text-forge-text">
            {rank.userRank != null ? (
              <>
                <span className="font-display text-xl font-bold text-forge-gold">
                  #{rank.userRank}
                </span>
                {rank.userScore != null && (
                  <span className="ml-2 text-forge-muted">
                    {rank.userScore} pts
                  </span>
                )}
              </>
            ) : (
              "Log this workout to appear on the board"
            )}
          </p>
          {rank.pointsToNextRank != null &&
            rank.pointsToNextRank > 0 &&
            rank.leaderAboveLabel && (
              <p className="mt-1 text-xs text-forge-muted">
                {rank.pointsToNextRank} pts to pass {rank.leaderAboveLabel}
              </p>
            )}
        </div>
        {rank.activePeerCount > 0 && (
          <p className="text-right text-[11px] text-forge-muted">
            {rank.activePeerCount} active
            <br />
            this week
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
