import { writeAdminAuditLog } from "@/lib/admin/audit";
import type { BroadcastSegment } from "@/lib/admin/broadcast-segments";
import { createAdminClient } from "@/lib/supabase/admin";
import webpush from "web-push";

export type { BroadcastSegment } from "@/lib/admin/broadcast-segments";
export { BROADCAST_SEGMENTS } from "@/lib/admin/broadcast-segments";

const MAX_RECIPIENTS = 500;
const MIN_REASON_LENGTH = 10;

export interface BroadcastRecipient {
  userId: string;
  email: string | null;
}

function validateReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REASON_LENGTH) {
    return `Reason must be at least ${MIN_REASON_LENGTH} characters.`;
  }
  return null;
}

function isPaidProfile(row: {
  subscription_tier: string | null;
  subscription_status: string | null;
}): boolean {
  const tier = row.subscription_tier;
  const status = row.subscription_status;
  return (
    (tier === "pro" || tier === "pro_plus") &&
    (status === "active" || status === "trialing")
  );
}

export async function resolveBroadcastRecipients(
  segment: BroadcastSegment
): Promise<BroadcastRecipient[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, subscription_tier, subscription_status, gamification_opt_in, onboarding_complete"
    );

  if (error) {
    console.error("broadcast recipient query failed:", error.message);
    return [];
  }

  const recipients: BroadcastRecipient[] = [];

  for (const row of data ?? []) {
    const userId = row.id as string;
    const email = (row.email as string | null) ?? null;
    const tier = row.subscription_tier as string | null;
    const status = row.subscription_status as string | null;
    const optIn = Boolean(row.gamification_opt_in);
    const onboardingComplete = Boolean(row.onboarding_complete);

    let include = false;

    switch (segment) {
      case "all_users":
        include = Boolean(email);
        break;
      case "paid_users":
        include = isPaidProfile({ subscription_tier: tier, subscription_status: status });
        break;
      case "free_users":
        include = !isPaidProfile({ subscription_tier: tier, subscription_status: status });
        break;
      case "pro_users":
        include =
          tier === "pro" &&
          (status === "active" || status === "trialing");
        break;
      case "pro_plus_users":
        include =
          tier === "pro_plus" &&
          (status === "active" || status === "trialing");
        break;
      case "community_opt_in":
        include = optIn;
        break;
      case "onboarding_incomplete":
        include = !onboardingComplete;
        break;
    }

    if (include) {
      recipients.push({ userId, email });
    }
  }

  return recipients.slice(0, MAX_RECIPIENTS);
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: "RESEND_API_KEY and EMAIL_FROM must be configured." };
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
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message ?? "Email send failed." };
  }

  return { ok: true };
}

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function sendPushToUser(input: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<boolean> {
  if (!ensureVapidConfigured()) {
    return false;
  }

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("community_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", input.userId);

  if (!subscriptions?.length) {
    return false;
  }

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url ?? "/home",
    tag: "admin-broadcast",
  });

  let sent = false;

  for (const row of subscriptions) {
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
      sent = true;
    } catch (error) {
      const statusCode =
        error instanceof webpush.WebPushError ? error.statusCode : null;
      if (statusCode === 404 || statusCode === 410) {
        await admin
          .from("community_push_subscriptions")
          .delete()
          .eq("endpoint", row.endpoint as string);
      }
    }
  }

  return sent;
}

export async function sendAdminBroadcast(input: {
  adminUserId: string;
  segment: BroadcastSegment;
  channel: "email" | "push" | "both";
  subject: string;
  body: string;
  url?: string;
  reason: string;
}): Promise<
  | {
      ok: true;
      attempted: number;
      emailSent: number;
      pushSent: number;
      skipped: number;
    }
  | { ok: false; error: string }
> {
  const reasonError = validateReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  if (!input.subject.trim() || !input.body.trim()) {
    return { ok: false, error: "Subject and body are required." };
  }

  const recipients = await resolveBroadcastRecipients(input.segment);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipients match this segment." };
  }

  let emailSent = 0;
  let pushSent = 0;
  let skipped = 0;

  const html = `<div style="font-family:sans-serif;line-height:1.5;color:#111">${input.body
    .split("\n")
    .map((line) => `<p>${line.replace(/</g, "&lt;")}</p>`)
    .join("")}</div>`;

  for (const recipient of recipients) {
    let delivered = false;

    if (input.channel === "email" || input.channel === "both") {
      if (recipient.email) {
        const result = await sendResendEmail({
          to: recipient.email,
          subject: input.subject.trim(),
          text: input.body.trim(),
          html,
        });
        if (result.ok) {
          emailSent += 1;
          delivered = true;
        }
      }
    }

    if (input.channel === "push" || input.channel === "both") {
      const pushed = await sendPushToUser({
        userId: recipient.userId,
        title: input.subject.trim(),
        body: input.body.trim(),
        url: input.url,
      });
      if (pushed) {
        pushSent += 1;
        delivered = true;
      }
    }

    if (!delivered) {
      skipped += 1;
    }
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "broadcast.send",
    payload: {
      segment: input.segment,
      channel: input.channel,
      subject: input.subject.trim(),
      reason: input.reason.trim(),
      attempted: recipients.length,
      emailSent,
      pushSent,
      skipped,
    },
  });

  return {
    ok: true,
    attempted: recipients.length,
    emailSent,
    pushSent,
    skipped,
  };
}

export async function previewBroadcastCount(
  segment: BroadcastSegment
): Promise<number> {
  const recipients = await resolveBroadcastRecipients(segment);
  return recipients.length;
}
