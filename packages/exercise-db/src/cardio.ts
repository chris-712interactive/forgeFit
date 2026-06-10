import { expandUserEquipment } from "./equipment";

export interface CardioPrescription {
  exerciseId: string;
  name: string;
  reps: string;
  notes: string;
}

const CARDIO_BY_EQUIPMENT: Record<string, CardioPrescription> = {
  treadmill: {
    exerciseId: "treadmill_incline_walk",
    name: "Incline Walk",
    reps: "15-25 min",
    notes: "Moderate pace, evidence-backed fat-loss adjunct",
  },
  rowing_machine: {
    exerciseId: "rowing_steady_state",
    name: "Rowing",
    reps: "15-25 min",
    notes: "Steady effort — full-body conditioning without impact",
  },
  exercise_bike: {
    exerciseId: "bike_intervals",
    name: "Bike Intervals",
    reps: "15-25 min",
    notes: "Alternate easy and moderate efforts",
  },
  elliptical: {
    exerciseId: "elliptical_steady",
    name: "Elliptical",
    reps: "15-25 min",
    notes: "Low-impact steady cardio",
  },
  stair_climber: {
    exerciseId: "stair_climber_steady",
    name: "Stair Climber",
    reps: "12-20 min",
    notes: "Moderate pace — lower-body focused conditioning",
  },
};

const FAT_LOSS_CARDIO_PRIORITY = [
  "treadmill",
  "stair_climber",
  "exercise_bike",
  "rowing_machine",
  "elliptical",
] as const;

const DEFAULT_CARDIO_PRIORITY = [
  "rowing_machine",
  "exercise_bike",
  "treadmill",
  "elliptical",
  "stair_climber",
] as const;

export function pickCardioExercise(
  userEquipment: string[],
  goal?: string
): CardioPrescription | undefined {
  const gear = new Set(expandUserEquipment(userEquipment));
  const priority =
    goal === "fat_loss" ? FAT_LOSS_CARDIO_PRIORITY : DEFAULT_CARDIO_PRIORITY;

  for (const equipment of priority) {
    if (!gear.has(equipment)) continue;
    const prescription = CARDIO_BY_EQUIPMENT[equipment];
    if (prescription) return prescription;
  }

  return undefined;
}
