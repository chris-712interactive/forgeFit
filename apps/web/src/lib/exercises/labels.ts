const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barbell",
  dumbbells: "Dumbbells",
  cables: "Cables",
  machines: "Machines",
  pull_up_bar: "Pull-up bar",
  bench: "Bench",
  squat_rack: "Squat rack",
  resistance_bands: "Resistance bands",
  kettlebells: "Kettlebells",
  treadmill: "Treadmill",
  rowing_machine: "Rowing machine",
  exercise_bike: "Exercise bike",
  elliptical: "Elliptical",
  stair_climber: "Stair climber",
  cardio_machines: "Cardio machines",
  bodyweight_only: "Bodyweight",
};

const PATTERN_LABELS: Record<string, string> = {
  squat: "Squat",
  hinge: "Hinge",
  horizontal_push: "Horizontal push",
  vertical_push: "Vertical push",
  horizontal_pull: "Horizontal pull",
  vertical_pull: "Vertical pull",
  lunge: "Lunge",
  carry: "Carry",
  core: "Core",
  isolation_arms: "Arm isolation",
  isolation_legs: "Leg isolation",
  cardio: "Cardio",
};

export function formatEquipment(value: string): string {
  return EQUIPMENT_LABELS[value] ?? value.replace(/_/g, " ");
}

export function formatPattern(value: string): string {
  return PATTERN_LABELS[value] ?? value.replace(/_/g, " ");
}
