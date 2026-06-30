import { formatRecoveryDuration } from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";

type PhaseTone = "warmup" | "workout" | "recovery";

const toneClasses: Record<PhaseTone, string> = {
  warmup: "text-forge-gold",
  workout: "text-forge-success",
  recovery: "text-forge-steel",
};

function WarmupIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden
    >
      <path d="M8 14.5a2 2 0 0 0 2-2.5c0-1.2-1.2-2.4-1.2-4 1.6 0 3.2 2 3.2 4.4a3.2 3.2 0 1 1-6.4 0 2 2 0 0 0 2 2.1Z" />
    </svg>
  );
}

function WorkoutIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden
    >
      <path d="M1.5 6.5h2.5l1-2h6l1 2h2.5" />
      <path d="M4 6.5v3M12 6.5v3" />
      <path d="M2.5 9.5h11" />
    </svg>
  );
}

function RecoveryIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden
    >
      <path d="M3 10c1.5-2 2.5-4 5-4s3.5 2 5 4" />
      <path d="M2 12.5h12" />
      <path d="M8 3.5v2" />
      <path d="M6 5.5h4" />
    </svg>
  );
}

const phaseIcons: Record<PhaseTone, typeof WarmupIcon> = {
  warmup: WarmupIcon,
  workout: WorkoutIcon,
  recovery: RecoveryIcon,
};

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
    duration: `~${mainWorkoutMinutes(session)} min`,
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
        className="flex flex-wrap items-center gap-2"
        aria-label={expectation}
      >
        {phases.map((phase, index) => {
          const Icon = phaseIcons[phase.tone];

          return (
            <div key={phase.key} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-forge-muted/50" aria-hidden>
                  ·
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="sr-only">{phase.ariaLabel}</span>
                <Icon className={toneClasses[phase.tone]} />
                <span
                  className={`font-display text-sm font-semibold tabular-nums ${toneClasses[phase.tone]}`}
                >
                  {phase.duration}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-forge-muted">
        {expectation}
      </p>
    </div>
  );
}
