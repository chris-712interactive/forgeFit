import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildWeeklyRecapShareText } from "./community-recap-share";
import { bucketLabel as formatBucketLabel } from "./community-labels";
import { previousCommunityWeekStartIso } from "./community-week";
import type { WeeklyCommunityRecap } from "./types";

type RecapSupabase = Pick<
  Awaited<ReturnType<typeof createClient>>,
  "from"
>;

async function loadWeeklyRecapRows(
  supabase: RecapSupabase,
  input: {
    bucketGoal: string;
    bucketExperience: string;
    lastWeekStart: string;
  }
) {
  const { data: rows } = await supabase
    .from("leaderboard_entries")
    .select("user_id, habit_score, score_flagged")
    .eq("bucket_goal", input.bucketGoal)
    .eq("bucket_experience", input.bucketExperience)
    .eq("week_start", input.lastWeekStart)
    .order("habit_score", { ascending: false });

  return (rows ?? []).filter((row) => row.score_flagged !== true);
}

export async function buildWeeklyRecapForUser(input: {
  userId: string;
  bucketGoal: string;
  bucketExperience: string;
  crewName?: string | null;
  supabase?: RecapSupabase;
}): Promise<WeeklyCommunityRecap | null> {
  const lastWeekStart = previousCommunityWeekStartIso();
  const supabase = input.supabase ?? (await createClient());
  const validRows = await loadWeeklyRecapRows(supabase, {
    bucketGoal: input.bucketGoal,
    bucketExperience: input.bucketExperience,
    lastWeekStart,
  });

  if (validRows.length === 0) {
    return null;
  }

  const index = validRows.findIndex((row) => row.user_id === input.userId);
  if (index < 0) {
    return null;
  }

  const lastWeekEnd = new Date(`${lastWeekStart}T12:00:00`);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
  const weekLabel = `${new Date(`${lastWeekStart}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${lastWeekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

  return {
    showRecap: true,
    lastWeekRank: index + 1,
    lastWeekScore: Number(validRows[index]!.habit_score),
    weekLabel,
    bucketLabel: formatBucketLabel(input.bucketGoal, input.bucketExperience),
    crewName: input.crewName ?? null,
  };
}

export function buildWeeklyRecapEmail(input: {
  recap: WeeklyCommunityRecap;
  firstName: string | null;
}): { subject: string; text: string; html: string } {
  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi there,";
  const shareLine = buildWeeklyRecapShareText(input.recap);
  const subject = `Your ForgeFit weekly recap — #${input.recap.lastWeekRank} in your bucket`;

  const text = [
    greeting,
    "",
    `Last week (${input.recap.weekLabel}) you finished #${input.recap.lastWeekRank} in your community bucket`,
    input.recap.lastWeekScore != null
      ? `with a ${input.recap.lastWeekScore} habit score.`
      : ".",
    input.recap.bucketLabel ? `Bucket: ${input.recap.bucketLabel}` : "",
    "",
    "Open ForgeFit to climb the board this week.",
    "",
    shareLine,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p>${greeting}</p>
    <p>
      Last week (<strong>${input.recap.weekLabel}</strong>) you finished
      <strong>#${input.recap.lastWeekRank}</strong> in your community bucket
      ${
        input.recap.lastWeekScore != null
          ? `with a <strong>${input.recap.lastWeekScore}</strong> habit score.`
          : "."
      }
    </p>
    ${
      input.recap.bucketLabel
        ? `<p style="color:#666;">Bucket: ${input.recap.bucketLabel}</p>`
        : ""
    }
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://joinforgefit.com"}/community">View this week&apos;s standings →</a></p>
    <p style="color:#666;font-size:12px;">You&apos;re receiving this because you opted into ForgeFit community. Turn off weekly recap emails in Profile → Community settings.</p>
  `.trim();

  return { subject, text, html };
}

export async function loadWeeklyRecapEmailRecipients(): Promise<
  {
    userId: string;
    email: string;
    firstName: string | null;
    bucketGoal: string;
    bucketExperience: string;
  }[]
> {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, email, first_name, gamification_opt_in, primary_goal, experience_level, subscription_tier, subscription_status"
    )
    .eq("gamification_opt_in", true)
    .in("subscription_tier", ["pro", "pro_plus"])
    .in("subscription_status", ["active", "trialing"]);

  if (!profiles?.length) {
    return [];
  }

  const userIds = profiles.map((profile) => profile.id as string);
  const { data: preferences } = await admin
    .from("community_email_preferences")
    .select("user_id, weekly_recap")
    .in("user_id", userIds);

  const weeklyRecapByUserId = new Map(
    (preferences ?? []).map((row) => [
      row.user_id as string,
      row.weekly_recap as boolean,
    ])
  );

  return profiles
    .filter(
      (profile) =>
        profile.email &&
        profile.primary_goal &&
        profile.experience_level &&
        weeklyRecapByUserId.get(profile.id as string) !== false
    )
    .map((profile) => ({
      userId: profile.id as string,
      email: profile.email as string,
      firstName: (profile.first_name as string | null) ?? null,
      bucketGoal: profile.primary_goal as string,
      bucketExperience: profile.experience_level as string,
    }));
}
