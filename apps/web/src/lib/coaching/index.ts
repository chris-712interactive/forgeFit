export type {
  CommunityWinRow,
  GamificationContext,
  LeaderboardEntryRow,
  WorkoutCoachingContext,
  WorkoutCoachingFeatures,
} from "./types";

export {
  getGamificationContext,
  recordCommunityWin,
  upsertWeeklyLeaderboardScore,
} from "./service";

export { getWorkoutCoachingFeatures } from "./workout-features";

export { detectSetPr, type DetectedWorkoutPr } from "./detect-pr";
