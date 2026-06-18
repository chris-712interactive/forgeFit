import { isTimedExercise } from "@forgefit/exercise-db";
import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import type { LocalExerciseSet } from "@forgefit/offline-sync";
import { snapPrescribedWeightKg } from "@/lib/progression/load-snapping";
import {
  clampWeightToE1rmBand,
  percent1rmForReps,
} from "@/lib/progression/one-rep-max";
import { parseTargetReps } from "@/lib/progression/rir-progression";
import type { UnitSystem } from "@/lib/types/profile";

const EASY_RIR = 3;
const MAX_BONUS_SETS = 1;

const WEIGHT_INCREASE_PCT: Record<ExperienceLevel, number> = {
  beginner: 0.025,
  intermediate: 0.05,
  advanced: 0.05,
};

export type EasySetSuggestionKind = "increase_weight" | "add_set";

export interface EasySetSuggestion {
  kind: EasySetSuggestionKind;
  message: string;
  nextSetClientId?: string;
  suggestedWeightKg?: number;
}

export interface EasySetSuggestionInput {
  set: LocalExerciseSet;
  exerciseId: string;
  targetReps: string;
  plannedSets: number;
  plannedExtraSets: number;
  allSetsForExercise: LocalExerciseSet[];
  experienceLevel: ExperienceLevel;
  goal: FitnessGoal;
  unit: UnitSystem;
  isDeloadWeek: boolean;
  estimatedE1rmKg?: number;
}

export function canSuggestEasyAdjustment(rir: number | undefined): boolean {
  return rir != null && rir >= EASY_RIR;
}

function nextIncompleteSet(
  sets: LocalExerciseSet[],
  afterSetNumber: number
): LocalExerciseSet | undefined {
  return sets
    .filter((row) => row.setNumber > afterSetNumber && !row.completed)
    .sort((a, b) => a.setNumber - b.setNumber)[0];
}

function bonusSetAllowed(
  sets: LocalExerciseSet[],
  plannedSets: number,
  plannedExtraSets: number
): boolean {
  const cap = plannedSets + plannedExtraSets + MAX_BONUS_SETS;
  return sets.length < cap;
}

export function buildEasySetSuggestion(
  input: EasySetSuggestionInput
): EasySetSuggestion | null {
  if (input.isDeloadWeek) return null;
  if (!canSuggestEasyAdjustment(input.set.rir)) return null;

  const isTimed = isTimedExercise(input.exerciseId);
  const nextSet = nextIncompleteSet(
    input.allSetsForExercise,
    input.set.setNumber
  );

  if (
    !isTimed &&
    input.set.weightKg != null &&
    input.set.weightKg > 0 &&
    nextSet
  ) {
    const targetReps = input.set.reps ?? parseTargetReps(input.targetReps);
    let bumped =
      input.set.weightKg *
      (1 + WEIGHT_INCREASE_PCT[input.experienceLevel]);

    if (input.estimatedE1rmKg != null && targetReps > 0) {
      bumped = clampWeightToE1rmBand(
        bumped,
        input.estimatedE1rmKg,
        targetReps,
        input.goal
      );
    }

    bumped = snapPrescribedWeightKg(input.exerciseId, bumped, input.unit);

    if (bumped > input.set.weightKg) {
      const pct =
        input.estimatedE1rmKg != null
          ? Math.round(
              percent1rmForReps(targetReps, input.goal) * 100
            )
          : null;

      return {
        kind: "increase_weight",
        nextSetClientId: nextSet.clientId,
        suggestedWeightKg: bumped,
        message: pct
          ? `Set felt easy — try ${bumped.toFixed(1)} kg on your next set (~${pct}% est. 1RM).`
          : `Set felt easy — try a slightly heavier load on your next set.`,
      };
    }
  }

  if (
    bonusSetAllowed(
      input.allSetsForExercise,
      input.plannedSets,
      input.plannedExtraSets
    )
  ) {
    return {
      kind: "add_set",
      message: isTimed
        ? "Set felt easy — add one bonus set if you have time and energy."
        : "Set felt easy — add one bonus working set to use that capacity.",
    };
  }

  return null;
}
