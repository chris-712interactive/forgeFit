import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { previousCommunityWeekStartIso } from "./community-week";
import {
  buildWeeklyRecapEmail,
  buildWeeklyRecapForUser,
  loadWeeklyRecapEmailRecipients,
} from "./community-weekly-recap";

export interface CommunityEmailSettings {
  configured: boolean;
  weeklyRecap: boolean;
}

const DEFAULT_WEEKLY_RECAP = true;

function tryAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export function isCommunityEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()
  );
}

export async function getCommunityEmailSettings(
  userId: string
): Promise<CommunityEmailSettings> {
  const configured = isCommunityEmailConfigured();
  if (!configured) {
    return { configured: false, weeklyRecap: DEFAULT_WEEKLY_RECAP };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("community_email_preferences")
    .select("weekly_recap")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    configured: true,
    weeklyRecap: data?.weekly_recap ?? DEFAULT_WEEKLY_RECAP,
  };
}

export async function saveCommunityEmailPreferences(input: {
  userId: string;
  weeklyRecap: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("community_email_preferences").upsert(
    {
      user_id: input.userId,
      weekly_recap: input.weeklyRecap,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: "Email is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: body || `Email send failed (${response.status})` };
  }

  return { ok: true };
}

export async function sendWeeklyCommunityRecapEmails(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  if (!isCommunityEmailConfigured()) {
    return { scanned: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const admin = tryAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for community email cron.");
  }

  const recapWeekStart = previousCommunityWeekStartIso();
  const recipients = await loadWeeklyRecapEmailRecipients();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const { data: existingSend } = await admin
      .from("community_email_sends")
      .select("id")
      .eq("user_id", recipient.userId)
      .eq("week_start", recapWeekStart)
      .eq("kind", "weekly_recap")
      .maybeSingle();

    if (existingSend) {
      skipped += 1;
      continue;
    }

    const recap = await buildWeeklyRecapForUser({
      userId: recipient.userId,
      bucketGoal: recipient.bucketGoal,
      bucketExperience: recipient.bucketExperience,
      supabase: admin,
    });

    if (!recap) {
      skipped += 1;
      continue;
    }

    const email = buildWeeklyRecapEmail({
      recap,
      firstName: recipient.firstName,
    });

    const result = await sendEmail({
      to: recipient.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (!result.ok) {
      console.error(
        `[community-email] weekly recap failed for ${recipient.userId}:`,
        result.error
      );
      failed += 1;
      continue;
    }

    await admin.from("community_email_sends").insert({
      user_id: recipient.userId,
      week_start: recapWeekStart,
      kind: "weekly_recap",
    });

    sent += 1;
  }

  return {
    scanned: recipients.length,
    sent,
    skipped,
    failed,
  };
}
