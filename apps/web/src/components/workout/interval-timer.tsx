"use client";

import {
  playIntervalCountdownTick,
  unlockTimerAudio,
} from "@/lib/audio/timer-sounds";
import { feedbackIntervalPhase } from "@/lib/workouts/timer-feedback";
import {
  formatIntervalProgress,
  intervalPhaseLabel,
  type IntervalBlockInfo,
  type IntervalPhase,
  type IntervalRunState,
} from "@/lib/workouts/interval-protocol";
import type { IntervalProtocol } from "@forgefit/offline-sync";
import { useEffect, useRef } from "react";
import { formatTimerSeconds } from "./timer-utils";
import {
  useCountdown,
  type CountdownCompleteMeta,
  type CountdownPersistState,
  type CountdownRestoreState,
} from "./use-countdown";

export interface IntervalTimerProps {
  protocol: IntervalProtocol;
  state: IntervalRunState;
  blocks: IntervalBlockInfo[];
  /** Skip the first work cue when parent already played it from the Start tap. */
  suppressInitialWorkCue?: boolean;
  restore?: CountdownRestoreState | null;
  onPersist?: (state: CountdownPersistState | null) => void;
  onPhaseComplete: (meta?: CountdownCompleteMeta) => void;
  onSkipPhase: () => void;
  onStop: () => void;
}

function phaseAccent(phase: IntervalPhase): {
  border: string;
  label: string;
  text: string;
  bar: string;
  pulse: string;
} {
  if (phase === "work") {
    return {
      border: "border-forge-ember/40",
      label: "text-forge-ember",
      text: "text-forge-ember",
      bar: "bg-forge-ember",
      pulse: "hold-timer-pulse",
    };
  }
  return {
    border: "border-forge-gold/40",
    label: "text-forge-gold",
    text: "text-forge-gold",
    bar: "bg-forge-gold",
    pulse: "rest-timer-pulse",
  };
}

export function IntervalTimer({
  protocol,
  state,
  blocks,
  suppressInitialWorkCue = false,
  restore,
  onPersist,
  onPhaseComplete,
  onSkipPhase,
  onStop,
}: IntervalTimerProps) {
  const lastCueKey = useRef<string | null>(null);
  const skippedInitialWork = useRef(false);
  const lastTickSecond = useRef<number | null>(null);
  const accent = phaseAccent(state.phase);
  const block = blocks[state.blockIndex];
  const progressLabel = formatIntervalProgress(protocol, state, blocks);

  const handleComplete = (meta?: CountdownCompleteMeta) => {
    onPhaseComplete(meta);
  };

  const { remaining, paused, progress, togglePause } = useCountdown({
    seconds: state.seconds,
    onComplete: handleComplete,
    restore,
    onPersist,
  });

  // Keep AudioContext alive across phase changes / app resume.
  useEffect(() => {
    void unlockTimerAudio();
    const onVisible = () => {
      void unlockTimerAudio();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  useEffect(() => {
    const cueKey = `${state.phase}-${state.roundIndex}-${state.blockIndex}`;
    if (lastCueKey.current === cueKey) return;
    lastCueKey.current = cueKey;
    lastTickSecond.current = null;

    if (
      suppressInitialWorkCue &&
      !skippedInitialWork.current &&
      state.phase === "work" &&
      state.roundIndex === 0 &&
      state.blockIndex === 0
    ) {
      skippedInitialWork.current = true;
      return;
    }

    if (state.phase === "work") {
      feedbackIntervalPhase("work");
    } else if (
      state.phase === "rest" ||
      state.phase === "between_exercise" ||
      state.phase === "pair_rest"
    ) {
      feedbackIntervalPhase("rest");
    }
  }, [
    state.phase,
    state.roundIndex,
    state.blockIndex,
    suppressInitialWorkCue,
  ]);

  useEffect(() => {
    if (paused) return;
    if (remaining > 3 || remaining <= 0) return;
    if (lastTickSecond.current === remaining) return;
    lastTickSecond.current = remaining;
    playIntervalCountdownTick();
  }, [remaining, paused]);

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-4">
      <div
        className={`mx-auto max-w-lg rounded-2xl border bg-forge-surface-raised p-4 shadow-lg ${accent.border} ${
          paused ? "" : accent.pulse
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${accent.label}`}
            >
              {intervalPhaseLabel(state.phase)}
              {paused && (
                <span className="ml-2 normal-case text-forge-muted">· Paused</span>
              )}
            </p>
            <p className={`font-display text-4xl font-bold ${accent.text}`}>
              {formatTimerSeconds(remaining)}
            </p>
            <p className="mt-1 truncate text-sm text-forge-muted">{progressLabel}</p>
            {block && block.names.length > 1 && (
              <p className="mt-1 text-xs text-forge-text/80">
                {block.names.join(" · ")}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                void unlockTimerAudio();
                togglePause();
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${accent.border} ${accent.label}`}
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => {
                void unlockTimerAudio();
                onSkipPhase();
              }}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={onStop}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
            >
              Stop
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forge-surface">
          <div
            className={`h-full rounded-full ${accent.bar} ${
              paused ? "" : "transition-all duration-1000 ease-linear"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
