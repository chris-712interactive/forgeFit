import type { HabitScoreBreakdown } from "@/lib/coaching/types";

interface HabitScoreBreakdownCardProps {
  breakdown: HabitScoreBreakdown;
  compact?: boolean;
}

export function HabitScoreBreakdownCard({
  breakdown,
  compact = false,
}: HabitScoreBreakdownCardProps) {
  const rows = [
    {
      label: "Training",
      points: breakdown.training,
      max: 40,
      detail: `${breakdown.workoutsCompleted}/${breakdown.workoutsPlanned} workouts`,
    },
    {
      label: "Protein",
      points: breakdown.nutrition,
      max: 35,
      detail: `${breakdown.proteinHitDays}/7 days on target`,
    },
    {
      label: "Quality",
      points: breakdown.quality,
      max: 25,
      detail: `${breakdown.qualitySessions}/4 quality sessions`,
    },
  ];

  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-forge-surface ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Habit score
          </h3>
          {!compact && (
            <p className="mt-1 text-xs text-forge-muted">
              Weekly total — training, nutrition, and session quality
            </p>
          )}
        </div>
        <p className="font-display text-2xl font-bold text-forge-gold">
          {breakdown.score}
        </p>
      </div>

      <ul className={`space-y-3 ${compact ? "mt-3" : "mt-4"}`}>
        {rows.map((row) => (
          <li key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-forge-text">{row.label}</span>
              <span className="text-forge-muted">
                {row.points}/{row.max}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-forge-surface-raised">
              <div
                className="h-full rounded-full bg-forge-ember transition-all"
                style={{ width: `${Math.min(100, (row.points / row.max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-forge-muted">{row.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
