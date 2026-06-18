export interface LeaderboardEntryRow {
  userId: string;
  displayLabel: string;
  habitScore: number;
  isCurrentUser: boolean;
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
}
