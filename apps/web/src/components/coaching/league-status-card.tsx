import type { LeagueContext } from "@/lib/coaching/types";
import { LeagueTierBadge } from "./league-tier-badge";

interface LeagueStatusCardProps {
  league: LeagueContext;
  userRank: number | null;
}

export function LeagueStatusCard({ league, userRank }: LeagueStatusCardProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
            Monthly league
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LeagueTierBadge tier={league.tier} label={league.tierLabel} size="md" />
            {userRank != null && (
              <span className="text-sm text-forge-text">
                #{userRank} in {league.tierLabel} this week
              </span>
            )}
          </div>
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-forge-muted">
            Compete within your {league.tierLabel} tier. Top 30% promote at month
            end; bottom 30% relegate. Score at least 2 weeks to qualify.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wide text-forge-muted">
            Tier peers this week
          </p>
          <p className="font-display text-2xl font-bold text-forge-text">
            {league.tierPeerCount}
          </p>
        </div>
      </div>

      {league.badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {league.badges.slice(0, 6).map((badge) => (
            <span
              key={`${badge.badgeKey}-${badge.seasonMonth ?? "lifetime"}`}
              className="rounded-lg border border-forge-gold/30 bg-forge-gold/5 px-2.5 py-1 text-[11px] font-medium text-forge-gold"
            >
              {badgeLabel(badge.badgeKey)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function badgeLabel(badgeKey: string): string {
  switch (badgeKey) {
    case "league_silver":
      return "Silver League";
    case "league_gold":
      return "Gold League";
    case "season_champion":
      return "Season Champion";
    case "season_podium":
      return "Podium";
    case "season_promoted":
      return "Promoted";
    default:
      return badgeKey;
  }
}
