import type {
  ExerciseSnapshot,
  IntervalMode,
  IntervalProtocol,
  WorkoutTemplateExercise,
} from "@forgefit/offline-sync";

export type IntervalPhase =
  | "work"
  | "rest"
  | "between_exercise"
  | "pair_rest"
  | "done";

export interface IntervalRunState {
  phase: IntervalPhase;
  /** 0-based round within the current exercise (density/tabata). */
  roundIndex: number;
  /**
   * density/tabata: exercise index.
   * superset_block: ordered group index.
   */
  blockIndex: number;
  /** Duration of the current phase in seconds. */
  seconds: number;
}

export interface IntervalBlockInfo {
  label: string;
  exerciseIndexes: number[];
  names: string[];
}

const VALID_MODES: IntervalMode[] = ["density", "tabata", "superset_block"];

export function isIntervalProtocol(
  value: unknown
): value is IntervalProtocol {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.mode === "string" &&
    VALID_MODES.includes(row.mode as IntervalMode) &&
    typeof row.workSeconds === "number" &&
    Number.isFinite(row.workSeconds) &&
    row.workSeconds > 0 &&
    typeof row.restSeconds === "number" &&
    Number.isFinite(row.restSeconds) &&
    row.restSeconds >= 0 &&
    typeof row.rounds === "number" &&
    Number.isFinite(row.rounds) &&
    row.rounds >= 1
  );
}

export function orderedSupersetGroups(
  exercises: Array<Pick<WorkoutTemplateExercise, "groupId" | "name">>
): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const exercise of exercises) {
    const group = (exercise.groupId ?? "").trim().toUpperCase();
    if (!group || seen.has(group)) continue;
    seen.add(group);
    groups.push(group);
  }
  return groups;
}

export function resolveIntervalBlocks(
  protocol: IntervalProtocol,
  exercises: Array<Pick<ExerciseSnapshot, "name" | "groupId">>
): IntervalBlockInfo[] {
  if (protocol.mode === "superset_block") {
    return orderedSupersetGroups(exercises).map((group) => {
      const exerciseIndexes: number[] = [];
      const names: string[] = [];
      exercises.forEach((exercise, index) => {
        if ((exercise.groupId ?? "").trim().toUpperCase() === group) {
          exerciseIndexes.push(index);
          names.push(exercise.name);
        }
      });
      return { label: `Pair ${group}`, exerciseIndexes, names };
    });
  }

  return exercises.map((exercise, index) => ({
    label: exercise.name,
    exerciseIndexes: [index],
    names: [exercise.name],
  }));
}

export function initialIntervalState(
  protocol: IntervalProtocol
): IntervalRunState {
  return {
    phase: "work",
    roundIndex: 0,
    blockIndex: 0,
    seconds: protocol.workSeconds,
  };
}

export function advanceIntervalState(
  protocol: IntervalProtocol,
  current: IntervalRunState,
  blockCount: number
): IntervalRunState {
  if (current.phase === "done" || blockCount <= 0) {
    return { ...current, phase: "done", seconds: 0 };
  }

  if (protocol.mode === "superset_block") {
    if (current.phase === "work") {
      const isLast = current.blockIndex >= blockCount - 1;
      if (isLast || protocol.restSeconds <= 0) {
        return {
          phase: "done",
          roundIndex: 0,
          blockIndex: current.blockIndex,
          seconds: 0,
        };
      }
      return {
        phase: "pair_rest",
        roundIndex: 0,
        blockIndex: current.blockIndex,
        seconds: protocol.restSeconds,
      };
    }

    // pair_rest → next pair work
    const nextBlock = current.blockIndex + 1;
    if (nextBlock >= blockCount) {
      return {
        phase: "done",
        roundIndex: 0,
        blockIndex: current.blockIndex,
        seconds: 0,
      };
    }
    return {
      phase: "work",
      roundIndex: 0,
      blockIndex: nextBlock,
      seconds: protocol.workSeconds,
    };
  }

  // density / tabata
  if (current.phase === "work") {
    if (protocol.restSeconds <= 0) {
      return advanceAfterExerciseRest(protocol, current, blockCount);
    }
    return {
      phase: "rest",
      roundIndex: current.roundIndex,
      blockIndex: current.blockIndex,
      seconds: protocol.restSeconds,
    };
  }

  if (current.phase === "rest") {
    const nextRound = current.roundIndex + 1;
    if (nextRound < protocol.rounds) {
      return {
        phase: "work",
        roundIndex: nextRound,
        blockIndex: current.blockIndex,
        seconds: protocol.workSeconds,
      };
    }
    return advanceAfterExerciseRest(protocol, current, blockCount);
  }

  if (current.phase === "between_exercise") {
    const nextBlock = current.blockIndex + 1;
    if (nextBlock >= blockCount) {
      return {
        phase: "done",
        roundIndex: 0,
        blockIndex: current.blockIndex,
        seconds: 0,
      };
    }
    return {
      phase: "work",
      roundIndex: 0,
      blockIndex: nextBlock,
      seconds: protocol.workSeconds,
    };
  }

  return { ...current, phase: "done", seconds: 0 };
}

function advanceAfterExerciseRest(
  protocol: IntervalProtocol,
  current: IntervalRunState,
  blockCount: number
): IntervalRunState {
  const isLastExercise = current.blockIndex >= blockCount - 1;
  const between = protocol.betweenExerciseRestSeconds ?? 0;

  if (!isLastExercise && protocol.mode === "tabata" && between > 0) {
    return {
      phase: "between_exercise",
      roundIndex: protocol.rounds - 1,
      blockIndex: current.blockIndex,
      seconds: between,
    };
  }

  if (isLastExercise) {
    return {
      phase: "done",
      roundIndex: current.roundIndex,
      blockIndex: current.blockIndex,
      seconds: 0,
    };
  }

  return {
    phase: "work",
    roundIndex: 0,
    blockIndex: current.blockIndex + 1,
    seconds: protocol.workSeconds,
  };
}

export function intervalPhaseLabel(phase: IntervalPhase): string {
  switch (phase) {
    case "work":
      return "Work";
    case "rest":
      return "Rest";
    case "between_exercise":
      return "Next exercise";
    case "pair_rest":
      return "Pair rest";
    case "done":
      return "Done";
  }
}

export function formatIntervalProgress(
  protocol: IntervalProtocol,
  state: IntervalRunState,
  blocks: IntervalBlockInfo[]
): string {
  const block = blocks[state.blockIndex];
  const blockLabel = block?.label ?? `Block ${state.blockIndex + 1}`;

  if (protocol.mode === "superset_block") {
    return `${blockLabel} · ${state.blockIndex + 1}/${blocks.length}`;
  }

  return `${blockLabel} · Round ${state.roundIndex + 1}/${protocol.rounds}`;
}
