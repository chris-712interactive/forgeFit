import type { WeeklyCommunityRecap } from "@/lib/coaching/types";
import Link from "next/link";

interface WeeklyCommunityRecapCardProps {
  recap: WeeklyCommunityRecap;
}

export function WeeklyCommunityRecapCard({ recap }: WeeklyCommunityRecapCardProps) {
  if (!recap.showRecap || recap.lastWeekRank == null) {
    return null;
  }

  return (
    <div className="rounded-xl border border-forge-ember/30 bg-forge-ember/5 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-ember">
        Last week&apos;s results
      </p>
      <p className="mt-1 text-sm text-forge-text">
        You finished{" "}
        <span className="font-display font-bold text-forge-gold">
          #{recap.lastWeekRank}
        </span>
        {recap.lastWeekScore != null && (
          <span className="text-forge-muted"> · {recap.lastWeekScore} pts</span>
        )}{" "}
        <span className="text-forge-muted">({recap.weekLabel})</span>
      </p>
      <p className="mt-1 text-xs text-forge-muted">
        New week — climb the board again.{" "}
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
