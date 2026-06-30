import { formatRecoveryDuration } from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";

type PhaseTone = "warmup" | "workout" | "recovery";

const phaseStyles: Record<
  PhaseTone,
  { text: string; watermark: string }
> = {
  warmup: {
    text: "text-forge-gold",
    watermark: "text-forge-gold",
  },
  workout: {
    text: "text-forge-success",
    watermark: "text-forge-success",
  },
  recovery: {
    text: "text-forge-steel",
    watermark: "text-forge-steel",
  },
};

function PhaseWatermark({
  tone,
  children,
}: {
  tone: PhaseTone;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-1/2 h-[3.25rem] w-[3.25rem] -translate-x-[58%] -translate-y-1/2 opacity-[0.18] sm:h-14 sm:w-14 ${phaseStyles[tone].watermark}`}
    >
      {children}
    </svg>
  );
}

function WarmupWatermark() {
  return (
    <PhaseWatermark tone="warmup">
      <path d="M24 40c4.5 0 7.5-3 7.5-6.5 0-3-3-6-3-10 4.5 0 9 5.5 9 11.5a8.5 8.5 0 1 1-17 0c0 3.5 2.5 5.5 3.5 5.5Z" />
    </PhaseWatermark>
  );
}

function WorkoutWatermark() {
  return (
    <PhaseWatermark tone="workout">
      <circle cx="24" cy="11" r="3.5" />
      <path d="M24 14.5V24" />
      <path d="M18 19h12" />
      <path d="M15 19v3.5M33 19v3.5" />
      <path d="M12 22.5h24" />
      <path d="M20 24v8M28 24v8" />
      <path d="M17 32h14" />
    </PhaseWatermark>
  );
}

function RecoveryWatermark() {
  return (
    <PhaseWatermark tone="recovery">
      <path d="M24 9a13 13 0 1 1 0 26 13 13 0 0 1 0-26Z" />
      <path d="M24 17v14M17 24h14" strokeWidth="2" />
      <path d="M33.5 11.5l2-2M33.5 11.5l-2 2" strokeWidth="1.75" />
    </PhaseWatermark>
  );
}

const phaseWatermarks: Record<PhaseTone, () => React.JSX.Element> = {
  warmup: WarmupWatermark,
  workout: WorkoutWatermark,
  recovery: RecoveryWatermark,
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
  Watermark,
}: {
  tone: PhaseTone;
  ariaLabel: string;
  duration: string;
  showDivider: boolean;
  Watermark: () => React.JSX.Element;
}) {
  return (
    <div
      className={`relative flex min-w-0 flex-1 items-center justify-center overflow-hidden px-1 py-3.5 sm:py-4 ${
        showDivider ? "border-l border-[var(--border)]" : ""
      }`}
    >
      <Watermark />
      <span
        className={`relative z-10 whitespace-nowrap font-display text-base font-semibold tabular-nums leading-none sm:text-lg ${phaseStyles[tone].text}`}
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
            Watermark={phaseWatermarks[phase.tone]}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-forge-muted">
        {expectation}
      </p>
    </div>
  );
}
