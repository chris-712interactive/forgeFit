import { formatRecoveryDuration } from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";

type PhaseTone = "warmup" | "workout" | "recovery";

const toneClasses: Record<PhaseTone, string> = {
  warmup: "text-forge-gold",
  workout: "text-forge-success",
  recovery: "text-forge-steel",
};

function PhaseIcon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex size-7 shrink-0 items-center justify-center sm:size-8 ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block size-[1.125rem] sm:size-5"
      >
        {children}
      </svg>
    </span>
  );
}

function WarmupIcon({ className = "" }: { className?: string }) {
  return (
    <PhaseIcon className={className}>
      <path d="M12 20c2.5 0 4-1.75 4-3.75 0-1.75-1.75-3.5-1.75-6 2.5 0 5 3 5 6.5a5 5 0 1 1-10 0c0 2 1.5 3.25 2.5 3.25Z" />
    </PhaseIcon>
  );
}

function WorkoutIcon({ className = "" }: { className?: string }) {
  return (
    <PhaseIcon className={className}>
      <path d="M2 10h4l1.5-3h9l1.5 3h4" />
      <path d="M6 10v4M18 10v4" />
      <path d="M4 14h16" />
    </PhaseIcon>
  );
}

function RecoveryIcon({ className = "" }: { className?: string }) {
  return (
    <PhaseIcon className={className}>
      <path d="M5 16c2-3 4-6 7-6s5 3 7 6" />
      <path d="M4 19h16" />
      <path d="M12 5v3" />
      <path d="M9.5 7.5h5" />
    </PhaseIcon>
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

function PhaseSegment({
  tone,
  ariaLabel,
  duration,
  showDivider,
  Icon,
}: {
  tone: PhaseTone;
  ariaLabel: string;
  duration: string;
  showDivider: boolean;
  Icon: typeof WarmupIcon;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center justify-center px-1 py-3 sm:px-2 ${
        showDivider ? "border-l border-[var(--border)]" : ""
      }`}
    >
      <div className="flex items-center justify-center gap-2 sm:gap-2.5">
        <Icon className={toneClasses[tone]} />
        <span
          className={`font-display text-base font-semibold tabular-nums leading-none sm:text-lg ${toneClasses[tone]}`}
        >
          {duration}
        </span>
        <span className="sr-only">{ariaLabel}</span>
      </div>
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
            Icon={phaseIcons[phase.tone]}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-forge-muted">
        {expectation}
      </p>
    </div>
  );
}
