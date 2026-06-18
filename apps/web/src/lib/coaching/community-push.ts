import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CommunityNotificationType } from "./community-social";
import webpush from "web-push";

export type CommunityPushPreferenceKey =
  | "rank_passed"
  | "close_to_pass"
  | "rival_events"
  | "cheer_received"
  | "follow_mutual"
  | "sunday_nudge";

export interface CommunityPushPreferences {
  rankPassed: boolean;
  closeToPass: boolean;
  rivalEvents: boolean;
  cheerReceived: boolean;
  followMutual: boolean;
  sundayNudge: boolean;
}

export interface CommunityPushSettings {
  configured: boolean;
  subscribed: boolean;
  preferences: CommunityPushPreferences;
}

const DEFAULT_PREFERENCES: CommunityPushPreferences = {
  rankPassed: true,
  closeToPass: true,
  rivalEvents: true,
  cheerReceived: true,
  followMutual: true,
  sundayNudge: true,
};

let vapidConfigured = false;

function preferenceKeyForNotificationType(
  type: CommunityNotificationType
): CommunityPushPreferenceKey | null {
  switch (type) {
    case "rank_passed":
      return "rank_passed";
    case "close_to_pass":
      return "close_to_pass";
    case "rival_ahead":
    case "rival_passed_you":
      return "rival_events";
    case "cheer_received":
      return "cheer_received";
    case "follow_mutual":
      return "follow_mutual";
    default:
      return null;
  }
}

function preferencesRowToModel(row: Record<string, unknown>): CommunityPushPreferences {
  return {
    rankPassed: row.rank_passed !== false,
    closeToPass: row.close_to_pass !== false,
    rivalEvents: row.rival_events !== false,
    cheerReceived: row.cheer_received !== false,
    followMutual: row.follow_mutual !== false,
    sundayNudge: row.sunday_nudge !== false,
  };
}

export function isCommunityPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  );
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) {
    return true;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? null;
}

function tryAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function getCommunityPushSettings(
  userId: string
): Promise<CommunityPushSettings> {
  const configured = isCommunityPushConfigured();
  if (!configured) {
    return {
      configured: false,
      subscribed: false,
      preferences: DEFAULT_PREFERENCES,
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
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    configured: true,
    subscribed: (count ?? 0) > 0,
    preferences: prefRow
      ? preferencesRowToModel(prefRow as Record<string, unknown>)
      : DEFAULT_PREFERENCES,
  };
}

export async function upsertPushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: subError } = await supabase.from("community_push_subscriptions").upsert(
    {
      user_id: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
      updated_at: now,
    },
    { onConflict: "endpoint" }
  );

  if (subError) {
    return { ok: false, error: subError.message };
  }

  const { error: prefError } = await supabase.from("community_push_preferences").upsert(
    {
      user_id: input.userId,
      updated_at: now,
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  if (prefError) {
    return { ok: false, error: prefError.message };
  }

  return { ok: true };
}

export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function updatePushPreferences(
  userId: string,
  preferences: Partial<CommunityPushPreferences>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (preferences.rankPassed != null) payload.rank_passed = preferences.rankPassed;
  if (preferences.closeToPass != null) payload.close_to_pass = preferences.closeToPass;
  if (preferences.rivalEvents != null) payload.rival_events = preferences.rivalEvents;
  if (preferences.cheerReceived != null) {
    payload.cheer_received = preferences.cheerReceived;
  }
  if (preferences.followMutual != null) payload.follow_mutual = preferences.followMutual;
  if (preferences.sundayNudge != null) payload.sunday_nudge = preferences.sundayNudge;

  const { error } = await supabase.from("community_push_preferences").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function isPushEnabledForUser(
  userId: string,
  preferenceKey: CommunityPushPreferenceKey
): Promise<boolean> {
  const admin = tryAdminClient();
  if (!admin) {
    return false;
  }

  const { data: pref } = await admin
    .from("community_push_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!pref) {
    return true;
  }

  const column = preferenceKey as keyof typeof pref;
  return pref[column] !== false;
}

async function removeSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const admin = tryAdminClient();
  if (!admin) return;

  await admin.from("community_push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function sendCommunityPush(input: {
  userId: string;
  preferenceKey: CommunityPushPreferenceKey;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<void> {
  if (!ensureVapidConfigured()) {
    return;
  }

  const enabled = await isPushEnabledForUser(input.userId, input.preferenceKey);
  if (!enabled) {
    return;
  }

  const admin = tryAdminClient();
  if (!admin) {
    return;
  }

  const { data: subscriptions } = await admin
    .from("community_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", input.userId);

  if (!subscriptions?.length) {
    return;
  }

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url ?? "/community",
    tag: input.tag ?? `community-${input.preferenceKey}`,
  });

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint as string,
            keys: {
              p256dh: row.p256dh as string,
              auth: row.auth as string,
            },
          },
          payload
        );
      } catch (error) {
        const statusCode =
          error instanceof webpush.WebPushError ? error.statusCode : null;
        if (statusCode === 404 || statusCode === 410) {
          await removeSubscriptionByEndpoint(row.endpoint as string);
        } else {
          console.error("community push send failed:", error);
        }
      }
    })
  );
}

export async function sendCommunityPushForNotification(input: {
  userId: string;
  type: CommunityNotificationType;
  title: string;
  body: string;
}): Promise<void> {
  const preferenceKey = preferenceKeyForNotificationType(input.type);
  if (!preferenceKey) {
    return;
  }

  await sendCommunityPush({
    userId: input.userId,
    preferenceKey,
    title: input.title,
    body: input.body,
    tag: `community-${input.type}`,
  });
}

function weekStartIso(date = new Date()): string {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);
  return start.toISOString().slice(0, 10);
}

export async function sendSundayCommunityNudges(): Promise<{
  scanned: number;
  sent: number;
}> {
  if (!ensureVapidConfigured()) {
    return { scanned: 0, sent: 0 };
  }

  const admin = tryAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for community push cron.");
  }

  const weekStart = weekStartIso();
  const { data: preferences, error } = await admin
    .from("community_push_preferences")
    .select("user_id")
    .eq("sunday_nudge", true);

  if (error || !preferences?.length) {
    return { scanned: 0, sent: 0 };
  }

  let sent = 0;

  for (const pref of preferences) {
    const userId = pref.user_id as string;

    const [{ data: profile }, { data: challenge }, { count: subCount }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("gamification_opt_in")
          .eq("id", userId)
          .maybeSingle(),
        admin
          .from("community_weekly_challenge_status")
          .select("completed, progress_value, target_value, challenge_key")
          .eq("user_id", userId)
          .eq("week_start", weekStart)
          .maybeSingle(),
        admin
          .from("community_push_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    if (!profile?.gamification_opt_in || (subCount ?? 0) === 0) {
      continue;
    }

    if (challenge?.completed) {
      continue;
    }

    const progress = challenge?.progress_value ?? 0;
    const target = challenge?.target_value ?? 0;
    const body =
      challenge?.challenge_key === "plan_completion"
        ? `You're at ${progress}% of this week's plan goal — one session could close the gap before Monday.`
        : `You're at ${progress}/${target} on this week's bucket challenge — finish strong before the reset.`;

    await sendCommunityPush({
      userId,
      preferenceKey: "sunday_nudge",
      title: "Final hours this week",
      body,
      tag: "community-sunday-nudge",
    });
    sent += 1;
  }

  return { scanned: preferences.length, sent };
}
