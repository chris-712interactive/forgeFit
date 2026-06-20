import { EXERCISES } from "./exercises";
import { getCatalogExerciseById } from "./catalog";
import { toHighlighterMuscles } from "./muscle-map";
import type { CatalogExercise, Exercise } from "./types";

/** Program-engine curated ids → best catalog match for demos. */
const CURATED_CATALOG_ALIASES: Record<string, string> = {
  hip_hinge_machine: "hyperextensions_back_extensions",
  bodyweight_hip_hinge: "butt_lift_bridge",
  barbell_bench: "barbell_bench_press_medium_grip",
  dumbbell_bench: "dumbbell_bench_press",
  push_up: "pushups",
  cable_fly: "cable_crossover",
  overhead_press: "barbell_shoulder_press",
  machine_shoulder_press: "machine_shoulder_military_press",
  barbell_row: "bent_over_barbell_row",
  dumbbell_row: "bent_over_two_dumbbell_row",
  cable_row: "seated_cable_rows",
  pull_up: "pullups",
  lat_pulldown: "wide_grip_lat_pulldown",
  band_pulldown: "band_assisted_pull_up",
  walking_lunge: "barbell_walking_lunge",
  leg_curl: "lying_leg_curls",
  leg_extension: "leg_extensions",
  tricep_pushdown: "triceps_pushdown",
  treadmill_incline_walk: "walking_treadmill",
  bike_intervals: "recumbent_bike",
  elliptical_steady: "elliptical_trainer",
  stair_climber_steady: "stairmaster",
};

function curatedToCatalog(exercise: Exercise): CatalogExercise {
  return {
    ...exercise,
    sourceId: exercise.id,
    secondaryMuscles: [],
    category: "strength",
    mechanic: "compound",
    instructions: [],
    imagePaths: [],
    highlightMuscles: toHighlighterMuscles(exercise.primaryMuscles),
  };
}

export function resolveExerciseDetail(id: string): CatalogExercise | undefined {
  const direct = getCatalogExerciseById(id);
  if (direct) return direct;

  const aliasId = CURATED_CATALOG_ALIASES[id];
  if (aliasId) {
    const aliased = getCatalogExerciseById(aliasId);
    const curated = EXERCISES.find((exercise) => exercise.id === id);
    if (aliased && curated) {
      return { ...aliased, id, equipment: curated.equipment };
    }
    if (aliased) return { ...aliased, id };
  }

  const curated = EXERCISES.find((exercise) => exercise.id === id);
  if (curated) return curatedToCatalog(curated);

  return undefined;
}
