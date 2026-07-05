"use server";

import { revalidatePath } from "next/cache";
import { ensureLeagueTier } from "@/lib/coaching/community-leagues";
import { canOptIntoCommunity, resolveCommunityBucket } from "@/lib/coaching/community-bucket";
import { recordCommunityAction } from "@/lib/coaching/community-metrics";
import type {
  WinPresetCommentKey,
  WinReactionKey,
} from "@/lib/coaching/community-reactions";
import { recordCommunityWin as persistCommunityWin } from "@/lib/coaching/service";
import { createClient } from "@/lib/supabase/server";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

export async function setGamificationOptIn(optIn: boolean): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "primary_goal, experience_level, date_of_birth, age, parent_consent_at"
    )
    .eq("id", user.id)
    .single();

  if (optIn) {
    const consent = canOptIntoCommunity(profile ?? {});
    if (!consent.allowed) {
      return { ok: false, error: consent.reason };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      gamification_opt_in: optIn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (
    optIn &&
    profile?.primary_goal &&
    profile?.experience_level
  ) {
    await ensureLeagueTier({
      userId: user.id,
      bucketGoal: profile.primary_goal,
      bucketExperience: profile.experience_level,
      bucketAgeCohort: resolveCommunityBucket(profile)?.bucketAgeCohort,
    });
    void recordCommunityAction(user.id, "opt_in");
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/community");
  return { ok: true };
}

export async function finishWorkoutCommunitySync(): Promise<{
  ok: boolean;
  rankDelta?: import("@/lib/coaching/types").LeaderboardRankDelta | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { getSubscriptionForUser } = await import("@/lib/billing/subscription");
  const { getServerSessionRecords } = await import(
    "@/lib/workouts/sessions-server"
  );
  const { syncLeaderboardAfterWorkout } = await import("@/lib/coaching/service");

  const subscription = await getSubscriptionForUser(user.id);
  const { records } = await getServerSessionRecords(user.id, 120);
  const rankDelta = await syncLeaderboardAfterWorkout(
    user.id,
    subscription,
    records
  );

  revalidatePath("/home");
  revalidatePath("/community");
  revalidatePath("/workout");

  return { ok: true, rankDelta };
}

export async function toggleCommunityWinCheer(winId: string): Promise<{
  ok: boolean;
  cheered?: boolean;
  cheerCount?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gamification_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false, error: "Join community to cheer wins." };
  }

  const { data: existing } = await supabase
    .from("community_win_cheers")
    .select("id")
    .eq("win_id", winId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_win_cheers")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { data: win } = await supabase
      .from("community_wins")
      .select("user_id, headline")
      .eq("id", winId)
      .maybeSingle();

    const { error } = await supabase.from("community_win_cheers").insert({
      win_id: winId,
      user_id: user.id,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    void recordCommunityAction(user.id, "cheer");

    if (win && win.user_id !== user.id) {
      const { data: cheererProfile } = await supabase
        .from("profiles")
        .select("first_name, display_name, email")
        .eq("id", user.id)
        .single();

      const cheererLabel =
        (cheererProfile?.first_name as string | null) ??
        (cheererProfile?.display_name as string | null) ??
        "Someone";

      const { notifyCheerReceived } = await import(
        "@/lib/coaching/community-social"
      );
      await notifyCheerReceived({
        winOwnerUserId: win.user_id as string,
        cheererLabel,
        winHeadline: win.headline as string,
      });
    }
  }

  const { count } = await supabase
    .from("community_win_cheers")
    .select("id", { count: "exact", head: true })
    .eq("win_id", winId);

  revalidatePath("/home");
  revalidatePath("/community");
  return {
    ok: true,
    cheered: !existing,
    cheerCount: count ?? 0,
  };
}

export async function publishWorkoutPrWin(input: {
  headline: string;
  detail: string;
  e1rmKg: number;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await persistCommunityWin({
    userId: user.id,
    winType: "pr",
    headline: input.headline,
    detail: input.detail,
    prE1rmKg: input.e1rmKg,
  });

  revalidatePath("/home");
}

async function requireCommunityMemberForInteractions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gamification_opt_in, community_suspended")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false as const, error: "Join community to react to wins." };
  }

  if (profile.community_suspended) {
    return { ok: false as const, error: "Community access is paused." };
  }

  return { ok: true as const, userId: user.id };
}

export async function toggleCommunityWinReaction(
  winId: string,
  reactionKey: WinReactionKey
): Promise<{ ok: boolean; active?: boolean; error?: string }> {
  const auth = await requireCommunityMemberForInteractions();
  if (!auth.ok) {
    return auth;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_win_reactions")
    .select("reaction_key")
    .eq("win_id", winId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (existing?.reaction_key === reactionKey) {
    const { error } = await supabase
      .from("community_win_reactions")
      .delete()
      .eq("win_id", winId)
      .eq("user_id", auth.userId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/home");
    revalidatePath("/community");
    return { ok: true, active: false };
  }

  const { error } = await supabase.from("community_win_reactions").upsert(
    {
      win_id: winId,
      user_id: auth.userId,
      reaction_key: reactionKey,
    },
    { onConflict: "win_id,user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  void recordCommunityAction(auth.userId, "reaction");

  revalidatePath("/home");
  revalidatePath("/community");
  return { ok: true, active: true };
}

export async function setCommunityWinPresetComment(
  winId: string,
  commentKey: WinPresetCommentKey | null
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireCommunityMemberForInteractions();
  if (!auth.ok) {
    return auth;
  }

  const supabase = await createClient();

  if (!commentKey) {
    const { error } = await supabase
      .from("community_win_preset_comments")
      .delete()
      .eq("win_id", winId)
      .eq("user_id", auth.userId);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("community_win_preset_comments").upsert(
      {
        win_id: winId,
        user_id: auth.userId,
        comment_key: commentKey,
      },
      { onConflict: "win_id,user_id" }
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    void recordCommunityAction(auth.userId, "comment");
  }

  revalidatePath("/home");
  revalidatePath("/community");
  return { ok: true };
}
