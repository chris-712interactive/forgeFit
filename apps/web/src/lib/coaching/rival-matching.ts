import type { LeaderboardEntryRow } from "./types";

/** Pick a weekly rival within ±3 ranks or ±5 habit points. */
export function pickWeeklyRivalUserId(
  userId: string,
  leaderboard: LeaderboardEntryRow[]
): string | null {
  const userIndex = leaderboard.findIndex((row) => row.userId === userId);
  if (userIndex < 0) {
    return null;
  }

  const userScore = leaderboard[userIndex]!.habitScore;
  const candidates: { userId: string; distance: number }[] = [];

  for (let index = 0; index < leaderboard.length; index += 1) {
    if (index === userIndex) continue;

    const entry = leaderboard[index]!;
    const rankDistance = Math.abs(index - userIndex);
    const scoreDistance = Math.abs(entry.habitScore - userScore);

    if (rankDistance <= 3 || scoreDistance <= 5) {
      candidates.push({
        userId: entry.userId,
        distance: rankDistance * 10 + scoreDistance,
      });
    }
  }

  if (candidates.length === 0) {
    if (userIndex > 0) {
      return leaderboard[userIndex - 1]!.userId;
    }
    if (userIndex < leaderboard.length - 1) {
      return leaderboard[userIndex + 1]!.userId;
    }
    return null;
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0]!.userId;
}

export function buildRivalRow(
  userId: string,
  rivalUserId: string,
  leaderboard: LeaderboardEntryRow[]
): {
  userId: string;
  displayLabel: string;
  habitScore: number;
  rank: number;
  pointsGap: number;
  isAhead: boolean;
} | null {
  const userIndex = leaderboard.findIndex((row) => row.userId === userId);
  const rivalIndex = leaderboard.findIndex((row) => row.userId === rivalUserId);
  if (userIndex < 0 || rivalIndex < 0) {
    return null;
  }

  const userEntry = leaderboard[userIndex]!;
  const rivalEntry = leaderboard[rivalIndex]!;
  const isAhead = rivalIndex < userIndex;

  return {
    userId: rivalEntry.userId,
    displayLabel: rivalEntry.displayLabel,
    habitScore: rivalEntry.habitScore,
    rank: rivalIndex + 1,
    pointsGap: Math.abs(rivalEntry.habitScore - userEntry.habitScore),
    isAhead,
  };
}
