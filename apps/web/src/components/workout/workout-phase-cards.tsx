"use client";

import {
  formatRecoveryDuration,
  recoveryEquipmentLabel,
  recoveryGuidanceSteps,
} from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";

export type PhaseTone = "warmup" | "workout" | "recovery";

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

export function buildSessionExpectation(
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

export function phasePreviewTitle(tone: PhaseTone, session: WorkoutSession): string {
  if (tone === "warmup") return session.warmupBlock?.name ?? "Warm-up";
  if (tone === "recovery") return session.recoveryBlock?.name ?? "Recovery";
  return session.name;
}

export function phasePreviewDuration(
  tone: PhaseTone,
  session: WorkoutSession
): string {
  if (tone === "warmup" && session.warmupBlock) {
    return formatWarmupDuration(session.warmupBlock.durationMinutes);
  }
  if (tone === "recovery" && session.recoveryBlock) {
    return formatRecoveryDuration(session.recoveryBlock.durationMinutes);
  }
  return `${mainWorkoutMinutes(session)} min`;
}

export function PhasePreviewContent({
  tone,
  session,
}: {
  tone: PhaseTone;
  session: WorkoutSession;
}) {
  const { text } = phaseStyles[tone];

  if (tone === "warmup" && session.warmupBlock) {
    const { warmupBlock: block } = session;
    return (
      <ul className="space-y-2">
        {block.movements.map((movement) => (
          <li
            key={movement.id}
            className="rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2"
          >
            <p className="text-sm font-medium text-forge-text">{movement.name}</p>
            <p className="mt-0.5 text-xs text-forge-muted">{movement.prescription}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (tone === "workout") {
    return (
      <ul className="space-y-2">
        {session.exercises.map((exercise) => (
          <li
            key={exercise.exerciseId}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2"
          >
            <span className="min-w-0 text-sm font-medium text-forge-text">
              {exercise.name}
            </span>
            <span className="shrink-0 text-sm tabular-nums text-forge-muted">
              {exercise.sets}×{exercise.reps}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (tone === "recovery" && session.recoveryBlock) {
    const { recoveryBlock: block } = session;
    const guidance = recoveryGuidanceSteps(block);
    return (
      <div className="space-y-3">
        <p className={`text-sm font-medium ${text}`}>
          {recoveryEquipmentLabel(block.equipment)}
        </p>
        <ul className="space-y-1.5 text-sm text-forge-muted">
          {guidance.map((step) => (
            <li key={step} className="flex gap-2">
              <span className={text}>·</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function PhaseSegment({
  tone,
  ariaLabel,
  duration,
  showDivider,
  onPress,
}: {
  tone: PhaseTone;
  ariaLabel: string;
  duration: string;
  showDivider: boolean;
  onPress?: () => void;
}) {
  const { text } = phaseStyles[tone];
  const className = `relative flex min-h-[4.25rem] min-w-0 flex-1 items-center justify-center overflow-hidden sm:min-h-[4.5rem] ${
    showDivider ? "border-l border-[var(--border)]" : ""
  } ${onPress ? "cursor-pointer transition-colors hover:bg-forge-surface/60" : ""}`;

  const content = (
    <>
      <PhaseWatermark tone={tone} />
      <span
        className={`relative z-10 whitespace-nowrap px-1 font-display text-base font-semibold tabular-nums leading-none sm:text-lg ${text}`}
      >
        {duration}
      </span>
      <span className="sr-only">{ariaLabel}</span>
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-label={`${ariaLabel}, ${duration}. View activities.`}
        className={`${className} text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forge-ember/50`}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function WorkoutPhaseCards({
  session,
  onPhaseSelect,
}: {
  session: WorkoutSession;
  onPhaseSelect?: (tone: PhaseTone) => void;
}) {
  const setCount = totalPlannedSets(session);

  const phases: Array<{
    key: PhaseTone;
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
        className="flex w-full items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-forge-surface/40"
        aria-label={expectation}
      >
        {phases.map((phase, index) => (
          <PhaseSegment
            key={phase.key}
            tone={phase.tone}
            ariaLabel={phase.ariaLabel}
            duration={phase.duration}
            showDivider={index > 0}
            onPress={
              onPhaseSelect ? () => onPhaseSelect(phase.tone) : undefined
            }
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-forge-muted">
        {expectation}
      </p>
    </div>
  );
}
