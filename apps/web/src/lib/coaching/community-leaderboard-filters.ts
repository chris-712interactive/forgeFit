import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntryRow } from "./types";

interface LeaderboardDbRow {
  user_id: string;
  display_label: string;
  habit_score: number | string;
  score_flagged?: boolean | null;
}

export function mapLeaderboardRow(
  row: LeaderboardDbRow,
  viewerUserId: string
): LeaderboardEntryRow {
  return {
    userId: row.user_id,
    displayLabel: row.display_label,
    habitScore: Number(row.habit_score),
    isCurrentUser: row.user_id === viewerUserId,
  };
}

export function filterLeaderboardRows(
  rows: LeaderboardDbRow[],
  suspendedUserIds: Set<string>,
  viewerUserId: string
): LeaderboardEntryRow[] {
  return rows
    .filter(
      (row) =>
        !row.score_flagged && !suspendedUserIds.has(row.user_id)
    )
    .map((row) => mapLeaderboardRow(row, viewerUserId));
}

export async function loadSuspendedUserIds(
  userIds: string[]
): Promise<Set<string>> {
  if (userIds.length === 0) {
    return new Set();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, community_suspended")
    .in("id", userIds);

  if (error) {
    return new Set();
  }

  return new Set(
    (data ?? [])
      .filter((row) => row.community_suspended === true)
      .map((row) => row.id as string)
  );
}
