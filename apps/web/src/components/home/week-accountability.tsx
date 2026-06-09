import type { WeeklyWorkStats } from "@/lib/home/types";
import Link from "next/link";

interface WeekAccountabilityProps {
  stats: WeeklyWorkStats;
  nextSessionDayIndex: number | null;
  nextSessionName: string | null;
}

export function WeekAccountability({
  stats,
  nextSessionDayIndex,
  nextSessionName,
}: WeekAccountabilityProps) {
  const pct =
    stats.workoutsPlanned > 0
      ? Math.min(
          100,
          Math.round((stats.workoutsCompleted / stats.workoutsPlanned) * 100)
        )
      : 0;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          This week
        </h2>
        <Link
          href="/workout"
          className="text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          View plan →
        </Link>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-3xl font-bold text-forge-text">
            {stats.workoutsCompleted}
            <span className="text-lg font-semibold text-forge-muted">
              /{stats.workoutsPlanned || "—"}
            </span>
          </p>
          <p className="mt-1 text-sm text-forge-muted">workouts completed</p>
        </div>
        <p className="font-display text-2xl font-bold text-forge-gold">{pct}%</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-forge-surface">
        <div
          className="h-full rounded-full bg-forge-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {nextSessionName && nextSessionDayIndex != null && (
        <Link
          href={`/workout?day=${nextSessionDayIndex}`}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white"
        >
          {stats.workoutsCompleted > 0 ? "Continue" : "Start"} {nextSessionName}
        </Link>
      )}
    </section>
  );
}
