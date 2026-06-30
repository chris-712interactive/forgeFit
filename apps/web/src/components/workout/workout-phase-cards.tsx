"use client";

import {
  formatRecoveryDuration,
  recoveryEquipmentLabel,
  recoveryGuidanceSteps,
} from "@/lib/workouts/recovery";
import { formatWarmupDuration } from "@/lib/workouts/warmup";
import type { WorkoutSession } from "@forgefit/program-engine";
import { useState } from "react";

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

function PhaseActivities({
  tone,
  session,
}: {
  tone: PhaseTone;
  session: WorkoutSession;
}) {
  if (tone === "warmup" && session.warmupBlock) {
    const { warmupBlock: block } = session;
    return (
      <ul className="space-y-1.5 text-left">
        {block.movements.map((movement) => (
          <li key={movement.id} className="min-w-0">
            <span className="block truncate text-xs font-medium text-forge-text">
              {movement.name}
            </span>
            <span className="block truncate text-[10px] leading-snug text-forge-muted">
              {movement.prescription}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (tone === "workout") {
    return (
      <ul className="space-y-1 text-left">
        {session.exercises.map((exercise) => (
          <li
            key={exercise.exerciseId}
            className="flex min-w-0 items-baseline justify-between gap-1 text-xs text-forge-text"
          >
            <span className="truncate font-medium">{exercise.name}</span>
            <span className="shrink-0 tabular-nums text-forge-muted">
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
      <div className="text-left">
        <p className="text-[10px] font-medium text-forge-steel">
          {recoveryEquipmentLabel(block.equipment)}
        </p>
        <ul className="mt-1 space-y-0.5 text-[10px] leading-snug text-forge-muted">
          {guidance.map((step) => (
            <li key={step} className="truncate">
              {step}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function PhaseFlipCard({
  tone,
  label,
  duration,
  session,
  showDivider,
  isFlipped,
  onToggle,
}: {
  tone: PhaseTone;
  label: string;
  duration: string;
  session: WorkoutSession;
  showDivider: boolean;
  isFlipped: boolean;
  onToggle: () => void;
}) {
  const { text } = phaseStyles[tone];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isFlipped}
      aria-label={
        isFlipped
          ? `${label} activities. Tap to show duration.`
          : `${label}, ${duration}. Tap to see activities.`
      }
      className={`group relative min-w-0 flex-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-ember/50 focus-visible:ring-offset-2 focus-visible:ring-offset-forge-surface ${
        showDivider ? "border-l border-[var(--border)]" : ""
      } ${isFlipped ? "min-h-[9.5rem] sm:min-h-[10rem]" : "min-h-[4.25rem] sm:min-h-[4.5rem]"}`}
      style={{ perspective: "1000px" }}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front — duration */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden [backface-visibility:hidden]"
          aria-hidden={isFlipped}
        >
          <PhaseWatermark tone={tone} />
          <span
            className={`relative z-10 whitespace-nowrap px-1 font-display text-base font-semibold tabular-nums leading-none sm:text-lg ${text}`}
          >
            {duration}
          </span>
        </div>

        {/* Back — activity list */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
          aria-hidden={!isFlipped}
        >
          <div className="flex min-h-0 flex-1 flex-col border-t-2 border-[var(--border)] bg-forge-surface/90 px-2 py-2">
            <p
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${text}`}
            >
              {label}
            </p>
            <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <PhaseActivities tone={tone} session={session} />
            </div>
            <p className="mt-1 shrink-0 text-[9px] text-forge-muted/80">
              Tap to close
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

export function WorkoutPhaseCards({ session }: { session: WorkoutSession }) {
  const [flippedKey, setFlippedKey] = useState<string | null>(null);
  const setCount = totalPlannedSets(session);

  const phases: Array<{
    key: string;
    tone: PhaseTone;
    label: string;
    duration: string;
  }> = [];

  if (session.warmupBlock) {
    phases.push({
      key: "warmup",
      tone: "warmup",
      label: "Warm-up",
      duration: formatWarmupDuration(session.warmupBlock.durationMinutes),
    });
  }

  phases.push({
    key: "workout",
    tone: "workout",
    label: "Workout",
    duration: `${mainWorkoutMinutes(session)} min`,
  });

  if (session.recoveryBlock) {
    phases.push({
      key: "recovery",
      tone: "recovery",
      label: "Recovery",
      duration: formatRecoveryDuration(session.recoveryBlock.durationMinutes),
    });
  }

  const expectation = buildSessionExpectation(session, setCount);

  function togglePhase(key: string) {
    setFlippedKey((current) => (current === key ? null : key));
  }

  return (
    <div>
      <div
        className="flex w-full items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-forge-surface/40 transition-[min-height] duration-300"
        aria-label={expectation}
      >
        {phases.map((phase, index) => (
          <PhaseFlipCard
            key={phase.key}
            tone={phase.tone}
            label={phase.label}
            duration={phase.duration}
            session={session}
            showDivider={index > 0}
            isFlipped={flippedKey === phase.key}
            onToggle={() => togglePhase(phase.key)}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-forge-muted">
        {expectation}
      </p>
    </div>
  );
}
