import { resolveExerciseDetail } from "@forgefit/exercise-db";
import { kgToLbs, lbsToKg, type UnitSystem } from "@/lib/units/measurements";

export type LoadSnapProfile = "barbell" | "dumbbell" | "kettlebell" | "machine";

/** Common competition-style kettlebell sizes (kg). */
const KETTLEBELL_KG = [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40];

/** Typical commercial-gym kettlebell sizes (lb): 20, 25, 30, … */
const KETTLEBELL_MIN_LB = 20;
const KETTLEBELL_STEP_LB = 5;

function snapToNearestGrid(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

function snapToNearestCatalog(value: number, catalog: number[]): number {
  if (catalog.length === 0) return value;
  let best = catalog[0]!;
  let bestDiff = Math.abs(value - best);
  for (const candidate of catalog) {
    const diff = Math.abs(value - candidate);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best;
}

export function getLoadSnapProfile(exerciseId: string): LoadSnapProfile {
  const detail = resolveExerciseDetail(exerciseId);
  if (!detail) return "dumbbell";

  const equipment = new Set(detail.equipment);

  if (exerciseId === "goblet_squat") {
    return equipment.has("kettlebells") && !equipment.has("dumbbells")
      ? "kettlebell"
      : "dumbbell";
  }

  if (
    equipment.has("barbell") &&
    !equipment.has("dumbbells") &&
    !equipment.has("kettlebells")
  ) {
    return "barbell";
  }

  if (
    equipment.has("machines") &&
    !equipment.has("dumbbells") &&
    !equipment.has("barbell")
  ) {
    return "machine";
  }

  if (
    equipment.has("kettlebells") &&
    !equipment.has("dumbbells") &&
    !equipment.has("barbell")
  ) {
    return "kettlebell";
  }

  if (equipment.has("dumbbells")) {
    return "dumbbell";
  }

  return "machine";
}

/** Snap a prescribed load to weights that exist on real gym equipment. */
export function snapPrescribedWeightKg(
  exerciseId: string,
  weightKg: number,
  unit: UnitSystem = "imperial"
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return weightKg;

  const profile = getLoadSnapProfile(exerciseId);

  if (profile === "kettlebell") {
    if (unit === "imperial") {
      const lbs = kgToLbs(weightKg);
      const snappedLbs = Math.max(
        KETTLEBELL_MIN_LB,
        snapToNearestGrid(lbs, KETTLEBELL_STEP_LB)
      );
      return Math.round(lbsToKg(snappedLbs) * 1000) / 1000;
    }
    return snapToNearestCatalog(weightKg, KETTLEBELL_KG);
  }

  if (unit === "imperial") {
    const lbs = kgToLbs(weightKg);
    const stepLb =
      profile === "dumbbell" && lbs < 30
        ? 2.5
        : profile === "dumbbell"
          ? 5
          : 5;
    let snappedLbs = snapToNearestGrid(lbs, stepLb);
    if (profile === "dumbbell") {
      snappedLbs = Math.max(5, snappedLbs);
    }
    return Math.round(lbsToKg(snappedLbs) * 1000) / 1000;
  }

  const stepKg =
    profile === "dumbbell" ? 2 : profile === "barbell" || profile === "machine" ? 2.5 : 2;
  return snapToNearestGrid(weightKg, stepKg);
}

export function weightInputStep(
  exerciseId: string,
  unit: UnitSystem
): number {
  const profile = getLoadSnapProfile(exerciseId);
  if (unit === "imperial") {
    if (profile === "kettlebell") return KETTLEBELL_STEP_LB;
    if (profile === "dumbbell") return 5;
    return 5;
  }
  if (profile === "kettlebell") return 2;
  if (profile === "dumbbell") return 2;
  return 2.5;
}
