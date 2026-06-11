import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { formatScheduledSessionDate } from "@/lib/workouts/schedule-dates";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { ProgramPlan } from "@forgefit/program-engine";
import Link from "next/link";

interface WeekScheduleProps {
  plan: ProgramPlan;
}

export function WeekSchedule({ plan }: WeekScheduleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-forge-text">
          This week
        </h2>
        <span className="text-xs text-forge-muted">
          {plan.week.length} sessions
        </span>
      </div>

      {plan.week.map((session) => (
        <article
          key={`${session.dayIndex}-${session.name}`}
          className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
                {session.dayLabel}
              </p>
              <p className="text-xs text-forge-muted">
                {formatScheduledSessionDate(session.dayIndex)}
              </p>
              <h3 className="font-display font-semibold text-forge-text">
                {session.name}
              </h3>
              <p className="mt-1 text-sm text-forge-muted">
                ~{session.estimatedMinutes} min · {session.exercises.length}{" "}
                exercises
              </p>
            </div>
            <Link
              href={`/workout?day=${session.dayIndex}`}
              className="shrink-0 rounded-lg bg-forge-ember/15 px-3 py-2 text-xs font-semibold text-forge-ember"
            >
              Start
            </Link>
          </div>

          <ul className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-3">
            {session.exercises.slice(0, 4).map((ex) => (
              <li
                key={ex.exerciseId}
                className="flex justify-between text-sm text-forge-muted"
              >
                <span className="text-forge-text">{ex.name}</span>
                <span>
                  {ex.sets}×{ex.reps}
                </span>
              </li>
            ))}
            {session.exercises.length > 4 && (
              <li className="text-xs text-forge-muted">
                +{session.exercises.length - 4} more
              </li>
            )}
          </ul>

          {session.warmupBlock && (
            <p className="mt-2 text-xs text-forge-gold">
              {formatWarmupDuration(session.warmupBlock.durationMinutes)}{" "}
              {session.warmupBlock.name.toLowerCase()}
            </p>
          )}
          {session.recoveryBlock && (
            <p className="mt-2 text-xs text-forge-steel">
              + {session.recoveryBlock.durationMinutes} min{" "}
              {session.recoveryBlock.name.toLowerCase()}
            </p>
          )}
        </article>
      ))}

      <section className="rounded-2xl bg-forge-surface-raised p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
          Daily nutrition targets
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <MacroPill label="Calories" value={`${plan.nutrition.calories}`} />
          <MacroPill label="Protein" value={`${plan.nutrition.proteinG}g`} accent="coral" />
          <MacroPill label="Carbs" value={`${plan.nutrition.carbsG}g`} accent="gold" />
          <MacroPill label="Fat" value={`${plan.nutrition.fatG}g`} accent="steel" />
        </div>
        {plan.nutrition.tdeeKcal != null && (
          <p className="mt-3 text-xs text-forge-muted">
            TDEE ~{plan.nutrition.tdeeKcal} kcal
            {plan.nutrition.trainingKcalPerDay != null && (
              <> · training ~{plan.nutrition.trainingKcalPerDay} kcal/day</>
            )}
            {plan.nutrition.effectiveDeficitKcal != null && (
              <> · deficit ~{plan.nutrition.effectiveDeficitKcal} kcal/day</>
            )}
            {plan.nutrition.effectiveSurplusKcal != null && (
              <> · surplus ~{plan.nutrition.effectiveSurplusKcal} kcal/day</>
            )}
          </p>
        )}
        <div className="mt-3">
          <EvidenceExplainerLink
            href={buildEvidenceHref()}
            label={`Based on ${plan.appliedRuleIds.length} evidence-backed rules`}
          />
        </div>
      </section>
    </div>
  );
}

function MacroPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "coral" | "gold" | "steel";
}) {
  const color =
    accent === "coral"
      ? "text-forge-coral"
      : accent === "gold"
        ? "text-forge-gold"
        : accent === "steel"
          ? "text-forge-steel"
          : "text-forge-text";

  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <p className="text-xs text-forge-muted">{label}</p>
      <p className={`font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}
