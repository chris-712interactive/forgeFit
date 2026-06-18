import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import type { CommunityWinRow } from "./types";

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

const MAX_CREW_MEMBERS = 8;

function isCrewTableMissing(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("community_crews") ||
    message.includes("community_crew_members") ||
    message.includes("schema cache")
  );
}

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return code;
}

export async function getUserCrew(userId: string): Promise<CrewContext | null> {
  noStore();
  const supabase = await createClient();

  const { data: membership, error: memberError } = await supabase
    .from("community_crew_members")
    .select("crew_id, role, joined_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError && !isCrewTableMissing(memberError)) {
    console.error("crew membership read failed:", memberError.message);
    return null;
  }

  if (!membership?.crew_id) {
    return null;
  }

  const { data: crew, error: crewError } = await supabase
    .from("community_crews")
    .select("id, name, invite_code, owner_id")
    .eq("id", membership.crew_id)
    .maybeSingle();

  if (crewError || !crew) {
    if (crewError && !isCrewTableMissing(crewError)) {
      console.error("crew read failed:", crewError.message);
    }
    return null;
  }

  const members = await getCrewMembers(crew.id as string);

  return {
    id: crew.id as string,
    name: crew.name as string,
    inviteCode: crew.invite_code as string,
    ownerId: crew.owner_id as string,
    memberCount: members.length,
    maxMembers: MAX_CREW_MEMBERS,
    members,
    isOwner: crew.owner_id === userId,
  };
}

async function getCrewMembers(crewId: string): Promise<CrewMemberRow[]> {
  const supabase = await createClient();
  const weekStart = (() => {
    const date = new Date();
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0, 10);
  })();

  const { data: memberRows, error } = await supabase
    .from("community_crew_members")
    .select("user_id, role, joined_at")
    .eq("crew_id", crewId)
    .order("joined_at", { ascending: true });

  if (error || !memberRows) {
    if (error && !isCrewTableMissing(error)) {
      console.error("crew members read failed:", error.message);
    }
    return [];
  }

  const userIds = memberRows.map((row) => row.user_id as string);
  const { data: leaderboardRows } = await supabase
    .from("leaderboard_entries")
    .select("user_id, display_label, habit_score")
    .in("user_id", userIds)
    .eq("week_start", weekStart);

  const scoreByUser = new Map<
    string,
    { displayLabel: string; habitScore: number | null }
  >(
    (leaderboardRows ?? []).map((row) => [
      row.user_id as string,
      {
        displayLabel: row.display_label as string,
        habitScore: Number(row.habit_score),
      },
    ])
  );

  const missingIds = userIds.filter((id) => !scoreByUser.has(id));
  if (missingIds.length > 0) {
    const { data: entries } = await supabase
      .from("leaderboard_entries")
      .select("user_id, display_label")
      .in("user_id", missingIds)
      .order("week_start", { ascending: false });

    for (const row of entries ?? []) {
      if (!scoreByUser.has(row.user_id as string)) {
        scoreByUser.set(row.user_id as string, {
          displayLabel: row.display_label as string,
          habitScore: null,
        });
      }
    }
  }

  return memberRows.map((row) => {
    const memberUserId = row.user_id as string;
    const stats = scoreByUser.get(memberUserId);
    return {
      userId: memberUserId,
      displayLabel: stats?.displayLabel ?? "Forge athlete",
      role: row.role as "owner" | "member",
      habitScore: stats?.habitScore ?? null,
      joinedAt: row.joined_at as string,
    };
  });
}

export async function getCrewPreviewByCode(
  userId: string,
  inviteCode: string
): Promise<{ id: string; name: string; memberCount: number } | null> {
  const supabase = await createClient();
  const normalized = inviteCode.trim().toUpperCase();

  const { data: crew, error } = await supabase
    .from("community_crews")
    .select("id, name")
    .eq("invite_code", normalized)
    .maybeSingle();

  if (error || !crew) {
    return null;
  }

  const { count } = await supabase
    .from("community_crew_members")
    .select("id", { count: "exact", head: true })
    .eq("crew_id", crew.id);

  void userId;
  return {
    id: crew.id as string,
    name: crew.name as string,
    memberCount: count ?? 0,
  };
}

export async function createCommunityCrew(
  userId: string,
  name: string
): Promise<{ ok: boolean; crew?: CrewContext; error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return { ok: false, error: "Crew name must be 2–40 characters." };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal, experience_level, gamification_opt_in")
    .eq("id", userId)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false, error: "Join community before starting a crew." };
  }

  const goal = profile.primary_goal;
  const experience = profile.experience_level;
  if (!goal || !experience) {
    return { ok: false, error: "Complete onboarding to set your bucket." };
  }

  const existing = await getUserCrew(userId);
  if (existing) {
    return { ok: false, error: "Leave your current crew before creating a new one." };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const { data: crew, error: crewError } = await supabase
      .from("community_crews")
      .insert({
        name: trimmed,
        invite_code: inviteCode,
        owner_id: userId,
        bucket_goal: goal,
        bucket_experience: experience,
      })
      .select("id")
      .single();

    if (crewError) {
      if (crewError.code === "23505") continue;
      return { ok: false, error: crewError.message };
    }

    const { error: memberError } = await supabase
      .from("community_crew_members")
      .insert({
        crew_id: crew.id,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      await supabase.from("community_crews").delete().eq("id", crew.id);
      return { ok: false, error: memberError.message };
    }

    const context = await getUserCrew(userId);
    return { ok: true, crew: context ?? undefined };
  }

  return { ok: false, error: "Could not generate invite code. Try again." };
}

export async function joinCommunityCrewByCode(
  userId: string,
  inviteCode: string
): Promise<{ ok: boolean; crew?: CrewContext; error?: string }> {
  const normalized = inviteCode.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, error: "Enter a valid invite code." };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal, experience_level, gamification_opt_in")
    .eq("id", userId)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false, error: "Join community before joining a crew." };
  }

  const existing = await getUserCrew(userId);
  if (existing) {
    return { ok: false, error: "Leave your current crew first." };
  }

  const { data: crew, error: crewError } = await supabase
    .from("community_crews")
    .select("id, bucket_goal, bucket_experience")
    .eq("invite_code", normalized)
    .maybeSingle();

  if (crewError || !crew) {
    return { ok: false, error: "Invite code not found in your bucket." };
  }

  if (
    crew.bucket_goal !== profile.primary_goal ||
    crew.bucket_experience !== profile.experience_level
  ) {
    return {
      ok: false,
      error: "This crew is in a different goal/experience bucket.",
    };
  }

  const { count } = await supabase
    .from("community_crew_members")
    .select("id", { count: "exact", head: true })
    .eq("crew_id", crew.id);

  if ((count ?? 0) >= MAX_CREW_MEMBERS) {
    return { ok: false, error: "This crew is full (8 members max)." };
  }

  const { error: joinError } = await supabase
    .from("community_crew_members")
    .insert({
      crew_id: crew.id,
      user_id: userId,
      role: "member",
    });

  if (joinError) {
    return { ok: false, error: joinError.message };
  }

  const context = await getUserCrew(userId);
  return { ok: true, crew: context ?? undefined };
}

export async function leaveCommunityCrew(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const crew = await getUserCrew(userId);
  if (!crew) {
    return { ok: false, error: "You are not in a crew." };
  }

  if (crew.isOwner) {
    const { error: deleteError } = await supabase
      .from("community_crews")
      .delete()
      .eq("id", crew.id)
      .eq("owner_id", userId);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from("community_crew_members")
    .delete()
    .eq("crew_id", crew.id)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getCrewWins(
  crewMemberIds: string[],
  bucketGoal: string,
  bucketExperience: string,
  currentUserId: string,
  limit = 8
): Promise<CommunityWinRow[]> {
  if (crewMemberIds.length === 0) {
    return [];
  }

  noStore();
  const supabase = await createClient();
  const { data: winRows, error } = await supabase
    .from("community_wins")
    .select("id, user_id, win_type, headline, detail, occurred_at")
    .eq("bucket_goal", bucketGoal)
    .eq("bucket_experience", bucketExperience)
    .in("user_id", crewMemberIds)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error || !winRows) {
    return [];
  }

  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + diff);
  const weekStartIso = weekStart.toISOString().slice(0, 10);

  const { data: leaderboardRows } = await supabase
    .from("leaderboard_entries")
    .select("user_id, display_label")
    .in("user_id", crewMemberIds)
    .eq("week_start", weekStartIso);

  const labelByUserId = new Map(
    (leaderboardRows ?? []).map((row) => [
      row.user_id as string,
      row.display_label as string,
    ])
  );

  const winIds = winRows.map((row) => row.id as string);
  const cheerCountByWinId = new Map<string, number>();
  const cheeredWinIds = new Set<string>();

  if (winIds.length > 0) {
    const { data: cheers } = await supabase
      .from("community_win_cheers")
      .select("win_id, user_id")
      .in("win_id", winIds);

    for (const cheer of cheers ?? []) {
      const winId = cheer.win_id as string;
      cheerCountByWinId.set(winId, (cheerCountByWinId.get(winId) ?? 0) + 1);
      if (cheer.user_id === currentUserId) {
        cheeredWinIds.add(winId);
      }
    }
  }

  return winRows.map((row) => {
    const winUserId = row.user_id as string;
    const winId = row.id as string;
    return {
      id: winId,
      userId: winUserId,
      displayLabel: labelByUserId.get(winUserId) ?? "Crew member",
      winType: row.win_type as CommunityWinRow["winType"],
      headline: row.headline as string,
      detail: (row.detail as string | null) ?? null,
      occurredAt: row.occurred_at as string,
      cheerCount: cheerCountByWinId.get(winId) ?? 0,
      cheeredByMe: cheeredWinIds.has(winId),
      isCurrentUser: winUserId === currentUserId,
    };
  });
}
