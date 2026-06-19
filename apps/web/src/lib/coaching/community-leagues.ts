import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntryRow } from "./types";
import { leagueTierLabel } from "./community-labels";

export type LeagueTier = "bronze" | "silver" | "gold";

export type CommunityBadgeKey =
  | "league_silver"
  | "league_gold"
  | "season_champion"
  | "season_podium"
  | "season_promoted";

export interface LeagueTierContext {
  tier: LeagueTier;
  tierLabel: string;
  tierPeerCount: number;
}

export interface CommunityBadgeRow {
  badgeKey: CommunityBadgeKey;
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
  newBadges: CommunityBadgeKey[];
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

export interface SeasonRolloverSummary {
  seasonsProcessed: number;
  usersProcessed: number;
  promoted: number;
  relegated: number;
  hofEntries: number;
  badgesAwarded: number;
  failures: string[];
}

const TIER_ORDER: Record<LeagueTier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
};

const MIN_WEEKS_FOR_SEASON = 2;
const MIN_GROUP_SIZE = 3;
const PROMOTE_FRACTION = 0.3;
const RELEGATE_FRACTION = 0.3;

function isLeagueTableMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("community_league_tiers") ||
    message.includes("community_season_results") ||
    message.includes("community_season_hof") ||
    message.includes("community_badges") ||
    message.includes("schema cache")
  );
}

function parseTier(value: string | null | undefined): LeagueTier {
  if (value === "silver" || value === "gold") return value;
  return "bronze";
}

function nextTier(tier: LeagueTier): LeagueTier | null {
  if (tier === "bronze") return "silver";
  if (tier === "silver") return "gold";
  return null;
}

function previousTier(tier: LeagueTier): LeagueTier | null {
  if (tier === "gold") return "silver";
  if (tier === "silver") return "bronze";
  return null;
}

export function seasonMonthStart(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function previousSeasonMonthStart(reference = new Date()): string {
  const date = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return seasonMonthStart(date);
}

export function formatSeasonLabel(seasonMonth: string): string {
  const date = new Date(`${seasonMonth}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function weekStartsInMonth(seasonMonth: string): string[] {
  const [year, month] = seasonMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const weeks: string[] = [];
  const cursor = new Date(firstDay);
  const day = cursor.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cursor.setDate(cursor.getDate() + diff);

  while (cursor <= lastDay) {
    weeks.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 7);
  }

  return [...new Set(weeks)];
}

export async function ensureLeagueTier(input: {
  userId: string;
  bucketGoal: string;
  bucketExperience: string;
}): Promise<LeagueTier | null> {
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("community_league_tiers")
    .select("tier, bucket_goal, bucket_experience")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (readError && !isLeagueTableMissing(readError)) {
    console.error("league tier read failed:", readError.message);
    return null;
  }

  if (readError && isLeagueTableMissing(readError)) {
    return null;
  }

  if (existing) {
    if (
      existing.bucket_goal === input.bucketGoal &&
      existing.bucket_experience === input.bucketExperience
    ) {
      return parseTier(existing.tier as string);
    }

    const { error: resetError } = await supabase
      .from("community_league_tiers")
      .update({
        bucket_goal: input.bucketGoal,
        bucket_experience: input.bucketExperience,
        tier: "bronze",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", input.userId);

    if (resetError && !isLeagueTableMissing(resetError)) {
      console.error("league tier reset failed:", resetError.message);
    }
    return "bronze";
  }

  const { error: insertError } = await supabase.from("community_league_tiers").insert({
    user_id: input.userId,
    bucket_goal: input.bucketGoal,
    bucket_experience: input.bucketExperience,
    tier: "bronze",
  });

  if (insertError && !isLeagueTableMissing(insertError)) {
    console.error("league tier insert failed:", insertError.message);
    return null;
  }

  return "bronze";
}

export async function getUserLeagueTier(userId: string): Promise<LeagueTier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_league_tiers")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    if (error && !isLeagueTableMissing(error)) {
      console.error("league tier lookup failed:", error.message);
    }
    return null;
  }

  return parseTier(data.tier as string);
}

export async function getTierMapForUserIds(
  userIds: string[]
): Promise<Map<string, LeagueTier>> {
  const map = new Map<string, LeagueTier>();
  if (userIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_league_tiers")
    .select("user_id, tier")
    .in("user_id", userIds);

  if (error) {
    if (!isLeagueTableMissing(error)) {
      console.error("tier map lookup failed:", error.message);
    }
    return map;
  }

  for (const row of data ?? []) {
    map.set(row.user_id as string, parseTier(row.tier as string));
  }

  return map;
}

export function filterLeaderboardByTier(
  leaderboard: LeaderboardEntryRow[],
  tierMap: Map<string, LeagueTier>,
  tier: LeagueTier
): LeaderboardEntryRow[] {
  return leaderboard.filter((entry) => (tierMap.get(entry.userId) ?? "bronze") === tier);
}

export async function fetchTierLeaderboard(input: {
  bucketGoal: string;
  bucketExperience: string;
  tier: LeagueTier;
  weekStart: string;
  userId: string;
  limit?: number;
}): Promise<LeaderboardEntryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("user_id, display_label, habit_score")
    .eq("bucket_goal", input.bucketGoal)
    .eq("bucket_experience", input.bucketExperience)
    .eq("week_start", input.weekStart)
    .order("habit_score", { ascending: false })
    .limit(Math.max(input.limit ?? 50, 100));

  if (error || !data || data.length === 0) {
    if (error && !isLeagueTableMissing(error)) {
      console.error("tier leaderboard lookup failed:", error.message);
    }
    return [];
  }

  const userIds = data.map((row) => row.user_id as string);
  const tierMap = await getTierMapForUserIds(userIds);

  const filtered = data
    .filter((row) => (tierMap.get(row.user_id as string) ?? "bronze") === input.tier)
    .slice(0, input.limit ?? 50);

  return filtered.map((row) => ({
    userId: row.user_id as string,
    displayLabel: row.display_label as string,
    habitScore: Number(row.habit_score),
    isCurrentUser: row.user_id === input.userId,
  }));
}

export async function getUserBadges(userId: string): Promise<CommunityBadgeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_badges")
    .select("badge_key, season_month, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) {
    if (!isLeagueTableMissing(error)) {
      console.error("badge lookup failed:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => ({
    badgeKey: row.badge_key as CommunityBadgeKey,
    seasonMonth: (row.season_month as string | null) ?? null,
    earnedAt: row.earned_at as string,
  }));
}

export async function getHallOfFame(input: {
  bucketGoal: string;
  bucketExperience: string;
  userId: string;
  limit?: number;
}): Promise<HallOfFameEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_season_hof")
    .select("season_month, rank, user_id, display_label, avg_habit_score")
    .eq("bucket_goal", input.bucketGoal)
    .eq("bucket_experience", input.bucketExperience)
    .order("season_month", { ascending: false })
    .order("rank", { ascending: true })
    .limit(input.limit ?? 12);

  if (error) {
    if (!isLeagueTableMissing(error)) {
      console.error("hall of fame lookup failed:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => {
    const seasonMonth = row.season_month as string;
    return {
      seasonMonth,
      seasonLabel: formatSeasonLabel(seasonMonth),
      rank: Number(row.rank),
      userId: row.user_id as string,
      displayLabel: row.display_label as string,
      avgHabitScore: Number(row.avg_habit_score),
      isCurrentUser: row.user_id === input.userId,
    };
  });
}

export async function buildSeasonRecap(
  userId: string,
  goal: string,
  experience: string
): Promise<SeasonRecap | null> {
  const dayOfMonth = new Date().getDate();
  if (dayOfMonth > 7) {
    return null;
  }

  const seasonMonth = previousSeasonMonthStart();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_season_results")
    .select(
      "tier_at_start, tier_at_end, weeks_scored, avg_habit_score, avg_rank, best_rank, promoted, relegated"
    )
    .eq("user_id", userId)
    .eq("season_month", seasonMonth)
    .maybeSingle();

  if (error || !data) {
    if (error && !isLeagueTableMissing(error)) {
      console.error("season recap lookup failed:", error.message);
    }
    return null;
  }

  const seasonStart = new Date(`${seasonMonth}T00:00:00.000Z`);
  const badgesAfter = new Date(seasonStart);
  badgesAfter.setUTCMonth(badgesAfter.getUTCMonth() + 1);

  const { data: badgeRows } = await supabase
    .from("community_badges")
    .select("badge_key")
    .eq("user_id", userId)
    .eq("season_month", seasonMonth);

  return {
    showRecap: true,
    seasonLabel: formatSeasonLabel(seasonMonth),
    seasonMonth,
    tierAtStart: parseTier(data.tier_at_start as string),
    tierAtEnd: parseTier(data.tier_at_end as string),
    promoted: Boolean(data.promoted),
    relegated: Boolean(data.relegated),
    avgHabitScore:
      data.avg_habit_score != null ? Number(data.avg_habit_score) : null,
    avgRank: data.avg_rank != null ? Number(data.avg_rank) : null,
    bestRank: data.best_rank != null ? Number(data.best_rank) : null,
    weeksScored: Number(data.weeks_scored),
    newBadges: (badgeRows ?? []).map((row) => row.badge_key as CommunityBadgeKey),
  };
}

async function awardBadgeAdmin(input: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  badgeKey: CommunityBadgeKey;
  seasonMonth?: string | null;
}): Promise<boolean> {
  let query = input.admin
    .from("community_badges")
    .select("id")
    .eq("user_id", input.userId)
    .eq("badge_key", input.badgeKey);

  if (input.seasonMonth) {
    query = query.eq("season_month", input.seasonMonth);
  } else {
    query = query.is("season_month", null);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return false;
  }

  const { error } = await input.admin.from("community_badges").insert({
    user_id: input.userId,
    badge_key: input.badgeKey,
    season_month: input.seasonMonth ?? null,
    earned_at: new Date().toISOString(),
  });

  return !error;
}

async function notifyLeagueChangeAdmin(input: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  type: "league_promoted" | "league_relegated" | "season_champion";
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await input.admin.from("community_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    payload: input.payload ?? {},
  });
}

interface SeasonParticipant {
  userId: string;
  displayLabel: string;
  tier: LeagueTier;
  weeksScored: number;
  avgHabitScore: number;
  avgRank: number;
  bestRank: number;
  weeklyRanks: number[];
}

/** Monthly cron — finalize prior season, promote/relegate, populate HOF. */
export async function processSeasonRollover(
  reference = new Date()
): Promise<SeasonRolloverSummary> {
  const summary: SeasonRolloverSummary = {
    seasonsProcessed: 0,
    usersProcessed: 0,
    promoted: 0,
    relegated: 0,
    hofEntries: 0,
    badgesAwarded: 0,
    failures: [],
  };

  const seasonMonth = previousSeasonMonthStart(reference);
  const weekStarts = weekStartsInMonth(seasonMonth);
  if (weekStarts.length === 0) {
    return summary;
  }

  const admin = createAdminClient();

  const { data: alreadyProcessed } = await admin
    .from("community_season_results")
    .select("id")
    .eq("season_month", seasonMonth)
    .limit(1);

  if (alreadyProcessed && alreadyProcessed.length > 0) {
    return summary;
  }

  const { data: tierRows, error: tierError } = await admin
    .from("community_league_tiers")
    .select("user_id, bucket_goal, bucket_experience, tier");

  if (tierError) {
    summary.failures.push(tierError.message);
    return summary;
  }

  if (!tierRows || tierRows.length === 0) {
    return summary;
  }

  const { data: scoreRows, error: scoreError } = await admin
    .from("leaderboard_entries")
    .select("user_id, bucket_goal, bucket_experience, week_start, habit_score, display_label")
    .in("week_start", weekStarts);

  if (scoreError) {
    summary.failures.push(scoreError.message);
    return summary;
  }

  type BucketKey = string;
  const bucketGroups = new Map<
    BucketKey,
    {
      bucketGoal: string;
      bucketExperience: string;
      participants: Map<string, SeasonParticipant>;
    }
  >();

  for (const tierRow of tierRows) {
    const bucketGoal = tierRow.bucket_goal as string;
    const bucketExperience = tierRow.bucket_experience as string;
    const bucketKey = `${bucketGoal}::${bucketExperience}`;
    if (!bucketGroups.has(bucketKey)) {
      bucketGroups.set(bucketKey, {
        bucketGoal,
        bucketExperience,
        participants: new Map(),
      });
    }
    const group = bucketGroups.get(bucketKey)!;
    if (!group.participants.has(tierRow.user_id as string)) {
      group.participants.set(tierRow.user_id as string, {
        userId: tierRow.user_id as string,
        displayLabel: "Forge athlete",
        tier: parseTier(tierRow.tier as string),
        weeksScored: 0,
        avgHabitScore: 0,
        avgRank: 0,
        bestRank: Number.MAX_SAFE_INTEGER,
        weeklyRanks: [],
      });
    }
  }

  for (const scoreRow of scoreRows ?? []) {
    const bucketGoal = scoreRow.bucket_goal as string;
    const bucketExperience = scoreRow.bucket_experience as string;
    const bucketKey = `${bucketGoal}::${bucketExperience}`;
    const group = bucketGroups.get(bucketKey);
    if (!group) continue;

    const participant = group.participants.get(scoreRow.user_id as string);
    if (!participant) continue;

    participant.displayLabel = scoreRow.display_label as string;
    participant.weeksScored += 1;
    participant.avgHabitScore += Number(scoreRow.habit_score);
  }

  for (const group of bucketGroups.values()) {
    summary.seasonsProcessed += 1;

    for (const weekStart of weekStarts) {
      const weekScores = (scoreRows ?? []).filter(
        (row) =>
          row.bucket_goal === group.bucketGoal &&
          row.bucket_experience === group.bucketExperience &&
          row.week_start === weekStart
      );

      const tierWeekBoards = new Map<LeagueTier, typeof weekScores>();
      for (const tier of ["bronze", "silver", "gold"] as LeagueTier[]) {
        tierWeekBoards.set(tier, []);
      }

      for (const row of weekScores) {
        const participant = group.participants.get(row.user_id as string);
        if (!participant) continue;
        tierWeekBoards.get(participant.tier)?.push(row);
      }

      for (const [tier, board] of tierWeekBoards.entries()) {
        board.sort(
          (a, b) => Number(b.habit_score) - Number(a.habit_score)
        );
        board.forEach((row, index) => {
          const participant = group.participants.get(row.user_id as string);
          if (!participant) return;
          const rank = index + 1;
          participant.weeklyRanks.push(rank);
          participant.bestRank = Math.min(participant.bestRank, rank);
        });
      }
    }

    const hofCandidates: SeasonParticipant[] = [];

    for (const participant of group.participants.values()) {
      if (participant.weeksScored < MIN_WEEKS_FOR_SEASON) {
        continue;
      }

      participant.avgHabitScore = Math.round(
        (participant.avgHabitScore / participant.weeksScored) * 100
      ) / 100;
      participant.avgRank =
        participant.weeklyRanks.length > 0
          ? Math.round(
              (participant.weeklyRanks.reduce((sum, rank) => sum + rank, 0) /
                participant.weeklyRanks.length) *
                100
            ) / 100
          : 0;

      if (participant.bestRank === Number.MAX_SAFE_INTEGER) {
        participant.bestRank = 0;
      }

      hofCandidates.push(participant);
    }

    hofCandidates.sort((a, b) => b.avgHabitScore - a.avgHabitScore);
    const hofTop = hofCandidates.slice(0, 3);

    for (let index = 0; index < hofTop.length; index += 1) {
      const entry = hofTop[index]!;
      const { error: hofError } = await admin.from("community_season_hof").upsert(
        {
          season_month: seasonMonth,
          bucket_goal: group.bucketGoal,
          bucket_experience: group.bucketExperience,
          rank: index + 1,
          user_id: entry.userId,
          display_label: entry.displayLabel,
          avg_habit_score: entry.avgHabitScore,
        },
        {
          onConflict: "season_month,bucket_goal,bucket_experience,rank",
        }
      );

      if (!hofError) {
        summary.hofEntries += 1;
        if (index === 0) {
          if (
            await awardBadgeAdmin({
              admin,
              userId: entry.userId,
              badgeKey: "season_champion",
              seasonMonth,
            })
          ) {
            summary.badgesAwarded += 1;
          }
          await notifyLeagueChangeAdmin({
            admin,
            userId: entry.userId,
            type: "season_champion",
            title: "Season champion!",
            body: `You topped your bucket in ${formatSeasonLabel(seasonMonth)} with a ${entry.avgHabitScore} avg habit score.`,
            payload: { seasonMonth, avgHabitScore: entry.avgHabitScore },
          });
        } else {
          if (
            await awardBadgeAdmin({
              admin,
              userId: entry.userId,
              badgeKey: "season_podium",
              seasonMonth,
            })
          ) {
            summary.badgesAwarded += 1;
          }
        }
      }
    }

    for (const tier of ["bronze", "silver", "gold"] as LeagueTier[]) {
      const tierParticipants = hofCandidates.filter(
        (participant) => participant.tier === tier
      );

      if (tierParticipants.length < MIN_GROUP_SIZE) {
        for (const participant of tierParticipants) {
          await saveSeasonResultAdmin({
            admin,
            participant,
            group,
            seasonMonth,
            tierAtEnd: participant.tier,
            promoted: false,
            relegated: false,
          });
          summary.usersProcessed += 1;
        }
        continue;
      }

      const promoteCount = Math.max(
        1,
        Math.floor(tierParticipants.length * PROMOTE_FRACTION)
      );
      const relegateCount = Math.max(
        1,
        Math.floor(tierParticipants.length * RELEGATE_FRACTION)
      );

      const sorted = [...tierParticipants].sort(
        (a, b) => b.avgHabitScore - a.avgHabitScore
      );

      const promoteSet = new Set(
        sorted.slice(0, promoteCount).map((participant) => participant.userId)
      );
      const relegateSet = new Set(
        sorted.slice(-relegateCount).map((participant) => participant.userId)
      );

      for (const participant of tierParticipants) {
        let tierAtEnd = participant.tier;
        let promoted = false;
        let relegated = false;

        if (promoteSet.has(participant.userId) && nextTier(participant.tier)) {
          tierAtEnd = nextTier(participant.tier)!;
          promoted = true;
          summary.promoted += 1;

          if (tierAtEnd === "silver") {
            if (
              await awardBadgeAdmin({
                admin,
                userId: participant.userId,
                badgeKey: "league_silver",
              })
            ) {
              summary.badgesAwarded += 1;
            }
          } else if (tierAtEnd === "gold") {
            if (
              await awardBadgeAdmin({
                admin,
                userId: participant.userId,
                badgeKey: "league_gold",
              })
            ) {
              summary.badgesAwarded += 1;
            }
          }

          if (
            await awardBadgeAdmin({
              admin,
              userId: participant.userId,
              badgeKey: "season_promoted",
              seasonMonth,
            })
          ) {
            summary.badgesAwarded += 1;
          }

          await notifyLeagueChangeAdmin({
            admin,
            userId: participant.userId,
            type: "league_promoted",
            title: `Promoted to ${leagueTierLabel(tierAtEnd)}!`,
            body: `Strong ${formatSeasonLabel(seasonMonth)} — you moved up from ${leagueTierLabel(participant.tier)}.`,
            payload: {
              seasonMonth,
              fromTier: participant.tier,
              toTier: tierAtEnd,
            },
          });
        } else if (
          relegateSet.has(participant.userId) &&
          !promoteSet.has(participant.userId) &&
          previousTier(participant.tier)
        ) {
          tierAtEnd = previousTier(participant.tier)!;
          relegated = true;
          summary.relegated += 1;

          await notifyLeagueChangeAdmin({
            admin,
            userId: participant.userId,
            type: "league_relegated",
            title: `Moved to ${leagueTierLabel(tierAtEnd)}`,
            body: `Your ${formatSeasonLabel(seasonMonth)} average dropped you from ${leagueTierLabel(participant.tier)}. Climb back this month!`,
            payload: {
              seasonMonth,
              fromTier: participant.tier,
              toTier: tierAtEnd,
            },
          });
        }

        await admin
          .from("community_league_tiers")
          .update({
            tier: tierAtEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", participant.userId);

        await saveSeasonResultAdmin({
          admin,
          participant,
          group,
          seasonMonth,
          tierAtEnd,
          promoted,
          relegated,
        });

        summary.usersProcessed += 1;
      }
    }
  }

  return summary;
}

async function saveSeasonResultAdmin(input: {
  admin: ReturnType<typeof createAdminClient>;
  participant: SeasonParticipant;
  group: { bucketGoal: string; bucketExperience: string };
  seasonMonth: string;
  tierAtEnd: LeagueTier;
  promoted: boolean;
  relegated: boolean;
}): Promise<void> {
  await input.admin.from("community_season_results").upsert(
    {
      user_id: input.participant.userId,
      bucket_goal: input.group.bucketGoal,
      bucket_experience: input.group.bucketExperience,
      season_month: input.seasonMonth,
      tier_at_start: input.participant.tier,
      tier_at_end: input.tierAtEnd,
      weeks_scored: input.participant.weeksScored,
      avg_habit_score: input.participant.avgHabitScore,
      avg_rank: input.participant.avgRank,
      best_rank:
        input.participant.bestRank === Number.MAX_SAFE_INTEGER
          ? null
          : input.participant.bestRank,
      promoted: input.promoted,
      relegated: input.relegated,
    },
    { onConflict: "user_id,season_month" }
  );
}

export function leagueTablesReady(): boolean {
  return true;
}

export { TIER_ORDER };
