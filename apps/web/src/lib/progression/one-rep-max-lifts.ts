/** Curated lifts users can declare 1RMs for — IDs match program-engine / exercise-db. */
export const ONE_REP_MAX_LIFTS = [
  { exerciseId: "barbell_squat", label: "Back Squat" },
  { exerciseId: "barbell_bench", label: "Bench Press" },
  { exerciseId: "barbell_deadlift", label: "Deadlift" },
  { exerciseId: "overhead_press", label: "Overhead Press" },
  { exerciseId: "romanian_deadlift", label: "Romanian Deadlift" },
  { exerciseId: "barbell_row", label: "Barbell Row" },
  { exerciseId: "goblet_squat", label: "Goblet Squat" },
  { exerciseId: "leg_press", label: "Leg Press" },
] as const;

export type OneRepMaxLiftId = (typeof ONE_REP_MAX_LIFTS)[number]["exerciseId"];

export const ONE_REP_MAX_EXERCISE_IDS = ONE_REP_MAX_LIFTS.map(
  (lift) => lift.exerciseId
);
