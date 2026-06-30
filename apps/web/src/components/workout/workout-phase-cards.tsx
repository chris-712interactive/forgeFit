import { formatRecoveryDuration } from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";

type PhaseTone = "warmup" | "workout" | "recovery";

const phaseStyles: Record<PhaseTone, { text: string; icon: string }> = {
  warmup: {
    text: "text-forge-gold",
    icon: "/icons/workout-phases/warmup.png",
  },
  workout: {
    text: "text-forge-success",
    icon: "/icons/workout-phases/workout.png",
  },
  recovery: {
    text: "text-forge-steel",
    icon: "/icons/workout-phases/recovery.png",
  },
};

function PhaseWatermark({ tone }: { tone: PhaseTone }) {
  const { icon } = phaseStyles[tone];

  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative watermark; clipped left edge
    <img
      src={icon}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute left-0 top-0 h-full w-auto max-w-none select-none mix-blend-lighten"
    />
  );
}

function totalPlannedSets(session: WorkoutSession): number {
  return session.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}

function mainWorkoutMinutes(session: WorkoutSession): number {
  const warmupMins = session.warmupBlock?.durationMinutes ?? 0;
  const recoveryMins = session.recoveryBlock?.durationMinutes ?? 0;
  return Math.max(1, session.estimatedMinutes - warmupMins - recoveryMins);
}

function buildSessionExpectation(
  session: WorkoutSession,
  setCount: number
): string {
  const exerciseCount = session.exercises.length;
  const exercisePhrase =
    exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;
  const setPhrase = setCount === 1 ? "1 set" : `${setCount} sets`;
  const workName = session.name.toLowerCase();
  const segments: string[] = [];

  if (session.warmupBlock) {
    segments.push(`Start with ${session.warmupBlock.name.toLowerCase()}`);
  }

  segments.push(
    session.warmupBlock
      ? `then ${workName} work (${exercisePhrase} · ${setPhrase})`
      : `${workName} session (${exercisePhrase} · ${setPhrase})`
  );

  if (session.recoveryBlock) {
    segments.push(`finish with ${session.recoveryBlock.name.toLowerCase()}`);
  }

  return `${segments.join(", ")}.`;
}

function PhaseSegment({
  tone,
  ariaLabel,
  duration,
  showDivider,
}: {
  tone: PhaseTone;
  ariaLabel: string;
  duration: string;
  showDivider: boolean;
}) {
  return (
    <div
      className={`relative flex min-h-[4.25rem] min-w-0 flex-1 items-center justify-center overflow-hidden sm:min-h-[4.5rem] ${
        showDivider ? "border-l border-[var(--border)]" : ""
      }`}
    >
      <PhaseWatermark tone={tone} />
      <span
        className={`relative z-10 whitespace-nowrap px-1 font-display text-base font-semibold tabular-nums leading-none sm:text-lg ${phaseStyles[tone].text}`}
      >
        {duration}
      </span>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

export function WorkoutPhaseCards({ session }: { session: WorkoutSession }) {
  const setCount = totalPlannedSets(session);

  const phases: Array<{
    key: string;
    tone: PhaseTone;
    ariaLabel: string;
    duration: string;
  }> = [];

  if (session.warmupBlock) {
    phases.push({
      key: "warmup",
      tone: "warmup",
      ariaLabel: "Warm-up",
      duration: formatWarmupDuration(session.warmupBlock.durationMinutes),
    });
  }

  phases.push({
    key: "workout",
    tone: "workout",
    ariaLabel: "Main workout",
    duration: `${mainWorkoutMinutes(session)} min`,
  });

  if (session.recoveryBlock) {
    phases.push({
      key: "recovery",
      tone: "recovery",
      ariaLabel: "Recovery",
      duration: formatRecoveryDuration(session.recoveryBlock.durationMinutes),
    });
  }

  const expectation = buildSessionExpectation(session, setCount);

  return (
    <div>
      <div
        className="flex w-full items-stretch rounded-xl border border-[var(--border)] bg-forge-surface/40"
        aria-label={expectation}
      >
        {phases.map((phase, index) => (
          <PhaseSegment
            key={phase.key}
            tone={phase.tone}
            ariaLabel={phase.ariaLabel}
            duration={phase.duration}
            showDivider={index > 0}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-forge-muted">
        {expectation}
      </p>
    </div>
  );
}
