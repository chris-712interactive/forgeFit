export { generateProgram } from "./generate";
export { buildWarmupBlock } from "./warmup";
export { computeNutrition, getMatchedRules } from "./nutrition";
export { applyDeloadWeek, isDeloadTrainingWeek } from "./deload";
export { computeTrainingLoad } from "./training-load";
export { estimateTrainingExpenditure } from "./training-expenditure";
export {
  assignSessionWeekdays,
  dayLabelForIndex,
  DAY_LABELS,
  isoWeekdayFromDate,
} from "./schedule";
export type {
  ProgramPlan,
  ProgramUserProfile,
  WorkoutSession,
  PlannedExercise,
  RecoveryBlock,
  WarmupBlock,
  WarmupMovement,
  NutritionTargets,
  TrainingLoadSummary,
  TrainingExpenditure,
  FitnessGoal,
  ExperienceLevel,
  GenerateProgramOptions,
} from "./types";
