import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  daysSinceIsoDate,
  isWeighInReminderGoal,
  WEIGH_IN_REMINDER_DAYS,
} from "@/lib/measurements/weigh-in-reminder";
import { getLastWeighInDate } from "@/lib/measurements/weigh-in-reminder-service";
import {
  getVapidPublicKey,
  isCommunityPushConfigured,
  sendCommunityPush,
} from "@/lib/coaching/community-push";

export interface WeighInPushSettings {
  configured: boolean;
  subscribed: boolean;
  weeklyWeighInNudge: boolean;
}

const PUSH_DEDUPE_DAYS = 6;

function tryAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function getWeighInPushSettings(
  userId: string
): Promise<WeighInPushSettings> {
  const configured = isCommunityPushConfigured();

  if (!configured) {
    return {
      configured: false,
      subscribed: false,
      weeklyWeighInNudge: true,
    };
  }

  const supabase = await createClient();
  const [{ count }, { data: prefRow }] = await Promise.all([
    supabase
      .from("community_push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("community_push_preferences")
      .select("weekly_weigh_in_nudge")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    configured: true,
    subscribed: (count ?? 0) > 0,
    weeklyWeighInNudge: prefRow?.weekly_weigh_in_nudge !== false,
  };
}

export async function updateWeighInPushPreference(
  userId: string,
  weeklyWeighInNudge: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("community_push_preferences").upsert(
    {
      user_id: userId,
      weekly_weigh_in_nudge: weeklyWeighInNudge,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function pushRecentlySent(lastPushAt: string | null | undefined): boolean {
  if (!lastPushAt) return false;
  const lastIso = lastPushAt.slice(0, 10);
  return daysSinceIsoDate(lastIso, todayIsoUtc()) < PUSH_DEDUPE_DAYS;
}

export async function sendWeeklyWeighInNudges(): Promise<{
  scanned: number;
  sent: number;
}> {
  if (!getVapidPublicKey()) {
    return { scanned: 0, sent: 0 };
  }

  const admin = tryAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for weigh-in push cron.");
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, primary_goal")
    .in("primary_goal", ["fat_loss", "recomposition"]);

  if (error || !profiles?.length) {
    return { scanned: 0, sent: 0 };
  }

  const today = todayIsoUtc();
  let sent = 0;

  for (const profile of profiles) {
    const userId = profile.id as string;
    const goal = profile.primary_goal as string;

    if (!isWeighInReminderGoal(goal as "fat_loss" | "recomposition")) {
      continue;
    }

    const [
      { count: subCount },
      { data: pref },
      lastWeighInDate,
    ] = await Promise.all([
      admin
        .from("community_push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      admin
        .from("community_push_preferences")
        .select("weekly_weigh_in_nudge, last_weigh_in_push_at")
        .eq("user_id", userId)
        .maybeSingle(),
      getLastWeighInDateAdmin(admin, userId),
    ]);

    if ((subCount ?? 0) === 0) {
      continue;
    }

    if (pref?.weekly_weigh_in_nudge === false) {
      continue;
    }

    if (pushRecentlySent(pref?.last_weigh_in_push_at as string | null)) {
      continue;
    }

    const daysSince =
      lastWeighInDate != null
        ? daysSinceIsoDate(lastWeighInDate, today)
        : WEIGH_IN_REMINDER_DAYS;

    if (daysSince < WEIGH_IN_REMINDER_DAYS) {
      continue;
    }

    const body =
      lastWeighInDate == null
        ? "Log a weigh-in in Progress — once a week is enough to track your cut honestly."
        : `It's been ${daysSince} days since your last weigh-in. Tap to log today's weight.`;

    await sendCommunityPush({
      userId,
      preferenceKey: "weekly_weigh_in_nudge",
      title: "Weekly weigh-in",
      body,
      url: "/progress?tab=log#log-measurement",
      tag: "progress-weigh-in-nudge",
    });

    await admin.from("community_push_preferences").upsert(
      {
        user_id: userId,
        last_weigh_in_push_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    sent += 1;
  }

  return { scanned: profiles.length, sent };
}

async function getLastWeighInDateAdmin(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data } = await admin
    .from("body_measurements")
    .select("measured_date")
    .eq("user_id", userId)
    .not("weight_kg", "is", null)
    .order("measured_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.measured_date as string | undefined) ?? null;
}
