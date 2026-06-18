export type {
  CommunityPageData,
  CommunityRankSnapshot,
  CommunityWinRow,
  GamificationContext,
  HabitScoreBreakdown,
  LeaderboardEntryRow,
  LeaderboardRankDelta,
  WeeklyCommunityRecap,
  WorkoutCoachingContext,
  WorkoutCoachingFeatures,
} from "./types";

export {
  getGamificationContext,
  getCommunityPageData,
  getCommunityRankSnapshot,
  recordCommunityWin,
  syncLeaderboardAfterWorkout,
  upsertWeeklyLeaderboardScore,
} from "./service";

export { getWorkoutCoachingFeatures } from "./workout-features";

export { detectSetPr, type DetectedWorkoutPr } from "./detect-pr";
