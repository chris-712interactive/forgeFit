import type { SeasonRecap } from "@/lib/coaching/types";
import Link from "next/link";
import { LeagueTierBadge } from "./league-tier-badge";

interface SeasonRecapCardProps {
  recap: SeasonRecap;
}

export function SeasonRecapCard({ recap }: SeasonRecapCardProps) {
  if (!recap.showRecap) {
    return null;
  }

  const tierChanged = recap.tierAtStart !== recap.tierAtEnd;

  return (
    <div className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-gold">
        {recap.seasonLabel} season results
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tierChanged ? (
          <>
            <LeagueTierBadge
              tier={recap.tierAtStart}
              label={tierLabel(recap.tierAtStart)}
            />
            <span className="text-forge-muted">→</span>
            <LeagueTierBadge
              tier={recap.tierAtEnd}
              label={tierLabel(recap.tierAtEnd)}
              size="md"
            />
          </>
        ) : (
          <LeagueTierBadge
            tier={recap.tierAtEnd}
            label={tierLabel(recap.tierAtEnd)}
            size="md"
          />
        )}
        {recap.promoted && (
          <span className="text-xs font-semibold text-forge-ember">Promoted</span>
        )}
        {recap.relegated && (
          <span className="text-xs font-semibold text-forge-coral">Relegated</span>
        )}
      </div>
      <p className="mt-2 text-sm text-forge-text">
        {recap.avgRank != null && (
          <>
            Avg rank{" "}
            <span className="font-display font-bold text-forge-gold">
              #{Math.round(recap.avgRank)}
            </span>
            {recap.avgHabitScore != null && (
              <span className="text-forge-muted">
                {" "}
                · {recap.avgHabitScore} avg pts
              </span>
            )}
            {recap.bestRank != null && recap.bestRank > 0 && (
              <span className="text-forge-muted">
                {" "}
                · best #{recap.bestRank}
              </span>
            )}
          </>
        )}
        {recap.avgRank == null && recap.weeksScored > 0 && (
          <span className="text-forge-muted">
            {recap.weeksScored} weeks scored
          </span>
        )}
      </p>
      {recap.newBadges.length > 0 && (
        <p className="mt-2 text-xs text-forge-muted">
          Badges earned: {recap.newBadges.map(badgeLabel).join(", ")}
        </p>
      )}
      <p className="mt-2 text-xs text-forge-muted">
        New month — climb your tier.{" "}
        <Link
          href="/community"
          className="font-medium text-forge-ember underline-offset-2 hover:underline"
        >
          See standings
        </Link>
      </p>
    </div>
  );
}

function tierLabel(tier: SeasonRecap["tierAtEnd"]): string {
  switch (tier) {
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
    default:
      return "Bronze";
  }
}

function badgeLabel(key: string): string {
  switch (key) {
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
      return key;
  }
}
