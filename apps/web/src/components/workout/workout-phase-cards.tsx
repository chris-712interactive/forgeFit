import { formatRecoveryDuration } from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";

type PhaseTone = "warmup" | "workout" | "recovery";

const toneClasses: Record<
  PhaseTone,
  { container: string; label: string }
> = {
  warmup: {
    container: "border-forge-gold/30 bg-forge-gold/5",
    label: "text-forge-gold",
  },
  workout: {
    container: "border-forge-success/30 bg-forge-success/5",
    label: "text-forge-success",
  },
  recovery: {
    container: "border-forge-steel/30 bg-forge-steel/5",
    label: "text-forge-steel",
  },
};

function PhaseCard({
  tone,
  label,
  duration,
  detail,
}: {
  tone: PhaseTone;
  label: string;
  duration: string;
  detail: string;
}) {
  const styles = toneClasses[tone];

  return (
    <div
      className={`min-w-0 flex-1 rounded-xl border p-2.5 sm:p-3 ${styles.container}`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider ${styles.label}`}
      >
        {label}
      </p>
      <p className="font-display text-lg font-semibold leading-tight text-forge-text sm:text-xl">
        {duration}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-forge-muted">
        {detail}
      </p>
    </div>
  );
}

function totalPlannedSets(session: WorkoutSession): number {
  return session.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}

function mainWorkoutMinutes(session: WorkoutSession): number {
  const warmupMins = session.warmupBlock?.durationMinutes ?? 0;
  const recoveryMins = session.recoveryBlock?.durationMinutes ?? 0;
  return Math.max(
    1,
    session.estimatedMinutes - warmupMins - recoveryMins
  );
}

export function WorkoutPhaseCards({ session }: { session: WorkoutSession }) {
  const exerciseCount = session.exercises.length;
  const setCount = totalPlannedSets(session);
  const exerciseLabel =
    exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;
  const setLabel = setCount === 1 ? "1 set" : `${setCount} sets`;

  const tiles: Array<{
    key: string;
    tone: PhaseTone;
    label: string;
    duration: string;
    detail: string;
  }> = [];

  if (session.warmupBlock) {
    const moveCount = session.warmupBlock.movements.length;
    const moveLabel = moveCount === 1 ? "1 move" : `${moveCount} moves`;
    tiles.push({
      key: "warmup",
      tone: "warmup",
      label: "Warm-up",
      duration: formatWarmupDuration(session.warmupBlock.durationMinutes),
      detail: `${session.warmupBlock.name} · ${moveLabel}`,
    });
  }

  tiles.push({
    key: "workout",
    tone: "workout",
    label: "Workout",
    duration: `~${mainWorkoutMinutes(session)} min`,
    detail: `${exerciseLabel} · ${setLabel}`,
  });

  if (session.recoveryBlock) {
    tiles.push({
      key: "recovery",
      tone: "recovery",
      label: "Recovery",
      duration: formatRecoveryDuration(session.recoveryBlock.durationMinutes),
      detail: session.recoveryBlock.name,
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
      {tiles.map((tile) => (
        <PhaseCard
          key={tile.key}
          tone={tile.tone}
          label={tile.label}
          duration={tile.duration}
          detail={tile.detail}
        />
      ))}
    </div>
  );
}
