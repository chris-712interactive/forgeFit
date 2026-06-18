import type { WeeklyRivalRow } from "@/lib/coaching/types";
import Link from "next/link";

interface WeeklyRivalCardProps {
  rival: WeeklyRivalRow;
  userRank: number | null;
  compact?: boolean;
}

export function WeeklyRivalCard({
  rival,
  userRank,
  compact = false,
}: WeeklyRivalCardProps) {
  return (
    <section
      className={`rounded-2xl border border-forge-ember/30 bg-forge-ember/5 ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-ember">
            Rival of the week
          </p>
          <p className="mt-1 font-display text-lg font-bold text-forge-text">
            {rival.displayLabel}
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            #{rival.rank} · {rival.habitScore} pts
          </p>
        </div>
        <div className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wide text-forge-muted">
            {rival.isAhead ? "Ahead by" : "You lead by"}
          </p>
          <p className="font-display text-xl font-bold text-forge-gold">
            {rival.pointsGap}
          </p>
          <p className="text-[11px] text-forge-muted">pts</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-forge-text">
        {rival.isAhead ? (
          <>
            {rival.pointsGap} pts to catch {rival.displayLabel}.
            {userRank != null && rival.rank < userRank
              ? " Log your next workout and close the gap."
              : null}
          </>
        ) : (
          <>
            You are {rival.pointsGap} pts ahead — keep the pressure on before
            they respond.
          </>
        )}
      </p>

      {!compact && (
        <Link
          href="/community"
          className="mt-3 inline-block text-sm font-medium text-forge-ember underline-offset-2 hover:underline"
        >
          Full standings →
        </Link>
      )}
    </section>
  );
}
