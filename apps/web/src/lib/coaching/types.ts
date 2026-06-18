export interface LeaderboardEntryRow {
  userId: string;
  displayLabel: string;
  habitScore: number;
  isCurrentUser: boolean;
}

export interface HabitScoreBreakdown {
  score: number;
  training: number;
  nutrition: number;
  quality: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  proteinHitDays: number;
  qualitySessions: number;
}

export interface LeaderboardRankDelta {
  previousRank: number | null;
  newRank: number | null;
  previousScore: number | null;
  newScore: number | null;
  rankChange: number | null;
  pointsToNextRank: number | null;
  leaderAboveLabel: string | null;
}

export interface CommunityRankSnapshot {
  unlocked: boolean;
  optedIn: boolean;
  bucketLabel: string | null;
  userRank: number | null;
  userScore: number | null;
  pointsToNextRank: number | null;
  leaderAboveLabel: string | null;
  activePeerCount: number;
}

export interface WeeklyCommunityRecap {
  showRecap: boolean;
  lastWeekRank: number | null;
  lastWeekScore: number | null;
  weekLabel: string;
}

export interface CommunityWinRow {
  id: string;
  userId: string;
  displayLabel: string;
  winType: "pr" | "weekly_plan" | "streak";
  headline: string;
  detail: string | null;
  occurredAt: string;
  cheerCount: number;
  cheeredByMe: boolean;
  isCurrentUser: boolean;
}

export interface GamificationContext {
  unlocked: boolean;
  optedIn: boolean;
  tableReady: boolean;
  bucketGoal: string | null;
  bucketExperience: string | null;
  bucketLabel: string | null;
  bucketPeerCount: number;
  activePeerCount: number;
  leaderboard: LeaderboardEntryRow[];
  communityWins: CommunityWinRow[];
  userRank: number | null;
  userScore: number | null;
  habitBreakdown: HabitScoreBreakdown | null;
  pointsToNextRank: number | null;
  leaderAboveLabel: string | null;
  weeklyRecap: WeeklyCommunityRecap | null;
}

export interface CommunityPageData {
  gamification: GamificationContext;
  fullLeaderboard: LeaderboardEntryRow[];
  totalRankedThisWeek: number;
}

export interface WorkoutCoachingContext {
  preWorkoutHype: string | null;
  prCelebrationEnabled: boolean;
  gamificationOptIn: boolean;
  priorBestE1rmKg: Record<string, number>;
  goal: import("@/lib/types/profile").FitnessGoal;
  displayName: string | null;
}

export interface WorkoutCoachingFeatures {
  aiMotivationEnabled: boolean;
  prCelebrationEnabled: boolean;
  gamificationOptIn: boolean;
  priorBestE1rmKg: Record<string, number>;
  goal: import("@/lib/types/profile").FitnessGoal;
  displayName: string | null;
  experienceLevel: import("@/lib/types/profile").ExperienceLevel;
  whyStarted: string | null;
  isDeloadWeek: boolean;
  workoutsCompletedThisWeek: number;
  workoutsPlannedThisWeek: number;
  communityRank: CommunityRankSnapshot | null;
}
