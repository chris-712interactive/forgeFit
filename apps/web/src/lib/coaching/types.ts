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
  weeklyRival: WeeklyRivalRow | null;
}

export interface WeeklyCommunityRecap {
  showRecap: boolean;
  lastWeekRank: number | null;
  lastWeekScore: number | null;
  weekLabel: string;
  bucketLabel?: string | null;
  crewName?: string | null;
}

export type LeagueTier = "bronze" | "silver" | "gold";

export interface CommunityBadgeRow {
  badgeKey: string;
  seasonMonth: string | null;
  earnedAt: string;
}

export interface SeasonRecap {
  showRecap: boolean;
  seasonLabel: string;
  seasonMonth: string;
  tierAtStart: LeagueTier;
  tierAtEnd: LeagueTier;
  promoted: boolean;
  relegated: boolean;
  avgHabitScore: number | null;
  avgRank: number | null;
  bestRank: number | null;
  weeksScored: number;
  bucketLabel?: string | null;
  newBadges: string[];
}

export interface HallOfFameEntry {
  seasonMonth: string;
  seasonLabel: string;
  rank: number;
  userId: string;
  displayLabel: string;
  avgHabitScore: number;
  isCurrentUser: boolean;
}

export interface LeagueContext {
  tier: LeagueTier;
  tierLabel: string;
  tierPeerCount: number;
  seasonRecap: SeasonRecap | null;
  badges: CommunityBadgeRow[];
  hallOfFame: HallOfFameEntry[];
}

export interface CrewMemberRow {
  userId: string;
  displayLabel: string;
  role: "owner" | "member";
  habitScore: number | null;
  joinedAt: string;
}

export interface CrewContext {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  memberCount: number;
  maxMembers: number;
  members: CrewMemberRow[];
  isOwner: boolean;
}

export interface WeeklyChallengeView {
  key: string;
  title: string;
  description: string;
  targetValue: number;
  unit: "percent" | "count";
  progressValue: number;
  completed: boolean;
  bucketCompletedCount: number;
  bucketParticipantCount: number;
}

export interface CrewChallengeView {
  completedCount: number;
  memberCount: number;
  targetPercent: number;
  crewMetGoal: boolean;
}

export interface WeeklyRivalRow {
  userId: string;
  displayLabel: string;
  habitScore: number;
  rank: number;
  pointsGap: number;
  isAhead: boolean;
}

export interface CommunityFollowRow {
  userId: string;
  displayLabel: string;
  habitScore: number | null;
  rank: number | null;
  isMutual: boolean;
  following: boolean;
}

export interface CommunityNotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface FollowState {
  following: boolean;
  isMutual: boolean;
}

export type WinReactionKey =
  | "fire"
  | "strong"
  | "clap"
  | "trophy"
  | "motivated";

export type WinPresetCommentKey =
  | "lets_go"
  | "crushing_it"
  | "inspired"
  | "same_goal"
  | "well_done";

export type CommunityOptInVariant = "control" | "default_on_ui";

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
  reactionCounts?: Partial<Record<WinReactionKey, number>>;
  myReaction?: WinReactionKey | null;
  commentCounts?: Partial<Record<WinPresetCommentKey, number>>;
  myComment?: WinPresetCommentKey | null;
}

export interface FlaggedScoreRow {
  userId: string;
  displayLabel: string;
  habitScore: number;
  flagReason: string | null;
  weekStart: string;
}

export interface ModerationWinRow {
  id: string;
  userId: string;
  displayLabel: string;
  headline: string;
  occurredAt: string;
  hiddenAt: string | null;
}

export interface ModerationQueue {
  flaggedScores: FlaggedScoreRow[];
  recentWins: ModerationWinRow[];
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
  weeklyRival: WeeklyRivalRow | null;
  unreadNotificationCount: number;
  recentNotifications: CommunityNotificationRow[];
  league: LeagueContext | null;
  optInVariant: CommunityOptInVariant;
  isModerator: boolean;
}

export interface CommunityPageData {
  gamification: GamificationContext;
  fullLeaderboard: LeaderboardEntryRow[];
  totalRankedThisWeek: number;
  friendsLeaderboard: CommunityFollowRow[];
  followState: Record<string, FollowState>;
  notifications: CommunityNotificationRow[];
  unreadNotificationCount: number;
  crew: CrewContext | null;
  weeklyChallenge: WeeklyChallengeView | null;
  crewChallenge: CrewChallengeView | null;
  crewWins: CommunityWinRow[];
  moderationQueue: ModerationQueue | null;
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
