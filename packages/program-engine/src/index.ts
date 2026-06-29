export { generateProgram } from "./generate";
export { buildWarmupBlock } from "./warmup";
export { computeNutrition, getMatchedRules } from "./nutrition";
export {
  describeEffectiveDeficit,
  describeFatLossPace,
  describeRecompPriority,
  fatLossPaceLabel,
  recompPriorityLabel,
  resolveFatLossPace,
  resolveRecompPriority,
  FAT_LOSS_PACE_DEFICIT_FIELD,
  RECOMP_BASE_DEFICIT_KCAL,
} from "./body-composition";
export { buildPlanTdeeBreakdown } from "./tdee-breakdown";
export type { PlanTdeeBreakdown, TdeeSegment } from "./tdee-breakdown";
export {
  estimateLoggedSessionActiveMinutes,
  estimateLoggedSessionKcal,
  sumLoggedSessionsKcal,
} from "./logged-session-expenditure";
export type {
  LoggedSessionSummary,
  LoggedSetSummary,
} from "./logged-session-expenditure";
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
  FatLossPace,
  RecompPriority,
  GenerateProgramOptions,
} from "./types";
