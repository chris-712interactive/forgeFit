import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SexBucket = "male" | "female" | "other" | "prefer_not_to_say" | "unknown";

export interface NamedCount {
  key: string;
  label: string;
  count: number;
  percent: number;
}

export interface MonthTrendPoint {
  periodMonth: string;
  label: string;
  clicks: number;
  signups: number;
  paidAccruals: number;
  commissionCents: number;
}

export interface PartnerPortalStats {
  periodMonth: string;
  clicks: number;
  signups: number;
  paidAccruals: number;
  estimatedCommissionCents: number;
  pendingCommissionCents: number;
  lifetimeCommissionCents: number;
  lifetimeSignups: number;
  lifetimePaidUsers: number;
  clickToSignupRate: number | null;
  signupToPaidRate: number | null;
  codes: string[];
  trackedLinkPath: string;
  clubBreakdown: Array<{ club: string; clicks: number; signups: number }>;
  /** Last 6 UTC months including current */
  monthlyTrend: MonthTrendPoint[];
  sexBreakdown: NamedCount[];
  goalBreakdown: NamedCount[];
  experienceBreakdown: NamedCount[];
  ageBreakdown: NamedCount[];
  demographicsSampleSize: number;
  demographicsVisible: boolean;
  tips: string[];
}

const MIN_DEMOGRAPHIC_SAMPLE = 5;
const MIN_BUCKET_COUNT = 2;

const SEX_LABELS: Record<SexBucket, string> = {
  male: "Men",
  female: "Women",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
  unknown: "Not set",
};

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "Fat loss",
  bodybuilding: "Bodybuilding",
  powerlifting: "Powerlifting",
  general_strength: "General strength",
  recomposition: "Recomposition",
  sport_performance: "Sport performance",
  functional_conditioning: "Functional conditioning",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function currentPeriodMonth(asOf = new Date()): string {
  return `${asOf.getUTCFullYear()}-${String(asOf.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(periodMonth: string): { start: string; end: string } {
  const [y, m] = periodMonth.split("-").map(Number);
  const start = `${periodMonth}-01T00:00:00.000Z`;
  const end =
    m === 12
      ? `${y + 1}-01-01T00:00:00.000Z`
      : `${y}-${String(m + 1).padStart(2, "0")}-01T00:00:00.000Z`;
  return { start, end };
}

function lastNPeriodMonths(n: number, asOf = new Date()): string[] {
  const months: string[] = [];
  const d = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1));
  for (let i = n - 1; i >= 0; i--) {
    const point = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    months.push(currentPeriodMonth(point));
  }
  return months;
}

function monthLabel(periodMonth: string): string {
  const [y, m] = periodMonth.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function ageBucket(age: number | null): string {
  if (age == null || Number.isNaN(age)) return "unknown";
  if (age < 18) return "under_18";
  if (age <= 24) return "18_24";
  if (age <= 34) return "25_34";
  if (age <= 44) return "35_44";
  if (age <= 54) return "45_54";
  return "55_plus";
}

const AGE_LABELS: Record<string, string> = {
  under_18: "Under 18",
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_54": "45–54",
  "55_plus": "55+",
  unknown: "Not set",
};

function toNamedCounts(
  counts: Map<string, number>,
  labels: Record<string, string>,
  total: number
): NamedCount[] {
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: labels[key] ?? key.replace(/_/g, " "),
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .filter((row) => row.count >= MIN_BUCKET_COUNT || row.key === "unknown")
    .sort((a, b) => b.count - a.count);
}

function buildTips(input: {
  clicks: number;
  signups: number;
  paidAccruals: number;
  clickToSignupRate: number | null;
  signupToPaidRate: number | null;
  sexBreakdown: NamedCount[];
  goalBreakdown: NamedCount[];
  partnerType: string;
  clubBreakdownLength: number;
}): string[] {
  const tips: string[] = [];

  if (input.clicks === 0) {
    tips.push(
      "Share your tracked link in bio, Stories, and emails — every click is how we attribute signups."
    );
  } else if (
    input.clickToSignupRate != null &&
    input.clickToSignupRate < 8 &&
    input.clicks >= 20
  ) {
    tips.push(
      "Click→signup is under 8%. Lead with a clear CTA (“Start free on ForgeRep”) and put the link above the fold."
    );
  }

  if (
    input.signupToPaidRate != null &&
    input.signupToPaidRate < 5 &&
    input.signups >= 15
  ) {
    tips.push(
      "Signups aren’t converting to paid yet. Mention Pro benefits (offline logging, projections) and your promo code in the same post."
    );
  } else if (
    input.signupToPaidRate != null &&
    input.signupToPaidRate >= 12
  ) {
    tips.push(
      "Strong signup→paid rate — double down on the creative that drove this month’s conversions."
    );
  }

  const men = input.sexBreakdown.find((s) => s.key === "male");
  const women = input.sexBreakdown.find((s) => s.key === "female");
  if (men && women && men.count + women.count >= MIN_DEMOGRAPHIC_SAMPLE) {
    if (men.percent >= 70) {
      tips.push(
        "Most referred members are men. Try a Reel or story angled at women lifters to broaden reach."
      );
    } else if (women.percent >= 70) {
      tips.push(
        "Most referred members are women. A strength/hypertrophy angle can help attract more men."
      );
    }
  }

  const topGoal = input.goalBreakdown[0];
  if (topGoal && topGoal.count >= MIN_DEMOGRAPHIC_SAMPLE) {
    tips.push(
      `Top goal in your audience: ${topGoal.label}. Mirror that language in captions and landing hooks.`
    );
  }

  if (input.partnerType === "gym" && input.clubBreakdownLength === 0) {
    tips.push(
      "Add ?club=YOUR_CLUB_ID to in-app or QR links to see which locations convert best."
    );
  }

  if (tips.length === 0) {
    tips.push(
      "Keep posting consistently and reuse your highest-performing creative with a fresh hook."
    );
  }

  return tips.slice(0, 4);
}

export async function getPartnerPortalStats(
  partnerId: string,
  partnerSlug: string,
  partnerType: string,
  periodMonth = currentPeriodMonth()
): Promise<PartnerPortalStats> {
  const admin = createAdminClient();
  const { start: monthStart, end: nextMonth } = monthBounds(periodMonth);
  const trendMonths = lastNPeriodMonths(6);
  const trendStart = monthBounds(trendMonths[0]!).start;

  const [
    { count: clicks },
    { data: monthAttrs },
    { data: commissions },
    { data: lifetimeCommissions },
    { data: codes },
    { data: clickEvents },
    { data: trendClicks },
    { data: allAttrs },
  ] = await Promise.all([
    admin
      .from("attribution_events")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId)
      .gte("created_at", monthStart)
      .lt("created_at", nextMonth),
    admin
      .from("user_attributions")
      .select("id, user_id, metadata, attributed_at")
      .eq("partner_id", partnerId)
      .gte("attributed_at", monthStart)
      .lt("attributed_at", nextMonth),
    admin
      .from("partner_commissions")
      .select("entry_kind, commission_cents, status, period_month, user_id")
      .eq("partner_id", partnerId)
      .eq("period_month", periodMonth),
    admin
      .from("partner_commissions")
      .select("commission_cents, period_month, entry_kind, user_id")
      .eq("partner_id", partnerId),
    admin
      .from("partner_codes")
      .select("code")
      .eq("partner_id", partnerId)
      .eq("active", true),
    admin
      .from("attribution_events")
      .select("metadata, created_at")
      .eq("partner_id", partnerId)
      .gte("created_at", monthStart)
      .lt("created_at", nextMonth)
      .limit(2000),
    admin
      .from("attribution_events")
      .select("created_at")
      .eq("partner_id", partnerId)
      .gte("created_at", trendStart)
      .limit(5000),
    admin
      .from("user_attributions")
      .select("user_id, metadata, attributed_at")
      .eq("partner_id", partnerId)
      .order("attributed_at", { ascending: false })
      .limit(2000),
  ]);

  let paidAccruals = 0;
  let estimatedCommissionCents = 0;
  let pendingCommissionCents = 0;
  for (const row of commissions ?? []) {
    estimatedCommissionCents += row.commission_cents as number;
    if (row.entry_kind === "accrual") paidAccruals += 1;
    if (row.status === "pending" || row.status === "payable") {
      pendingCommissionCents += row.commission_cents as number;
    }
  }

  const lifetimeCommissionCents = (lifetimeCommissions ?? []).reduce(
    (sum, row) => sum + (row.commission_cents as number),
    0
  );

  const lifetimePaidUsers = new Set(
    (lifetimeCommissions ?? [])
      .filter((row) => row.entry_kind === "accrual")
      .map((row) => row.user_id as string)
  ).size;

  const lifetimeSignups = allAttrs?.length ?? 0;
  const signups = monthAttrs?.length ?? 0;
  const clickCount = clicks ?? 0;
  const clickToSignupRate =
    clickCount > 0 ? Math.round((signups / clickCount) * 1000) / 10 : null;
  const signupToPaidRate =
    signups > 0 ? Math.round((paidAccruals / signups) * 1000) / 10 : null;

  const clubClicks = new Map<string, number>();
  for (const event of clickEvents ?? []) {
    const meta = event.metadata as { club?: string | null } | null;
    const club = meta?.club?.trim();
    if (club) clubClicks.set(club, (clubClicks.get(club) ?? 0) + 1);
  }

  const clubSignups = new Map<string, number>();
  for (const attr of monthAttrs ?? []) {
    const meta = attr.metadata as { club?: string | null } | null;
    const club = meta?.club?.trim();
    if (club) clubSignups.set(club, (clubSignups.get(club) ?? 0) + 1);
  }

  const clubKeys = new Set([...clubClicks.keys(), ...clubSignups.keys()]);
  const clubBreakdown = [...clubKeys]
    .map((club) => ({
      club,
      clicks: clubClicks.get(club) ?? 0,
      signups: clubSignups.get(club) ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25);

  // Monthly trend
  const clicksByMonth = new Map<string, number>();
  for (const event of trendClicks ?? []) {
    const created = event.created_at as string;
    const key = created.slice(0, 7);
    clicksByMonth.set(key, (clicksByMonth.get(key) ?? 0) + 1);
  }
  const signupsByMonth = new Map<string, number>();
  for (const attr of allAttrs ?? []) {
    const key = (attr.attributed_at as string).slice(0, 7);
    if (trendMonths.includes(key)) {
      signupsByMonth.set(key, (signupsByMonth.get(key) ?? 0) + 1);
    }
  }
  const paidByMonth = new Map<string, number>();
  const commissionByMonth = new Map<string, number>();
  for (const row of lifetimeCommissions ?? []) {
    const key = row.period_month as string;
    commissionByMonth.set(
      key,
      (commissionByMonth.get(key) ?? 0) + (row.commission_cents as number)
    );
    if (row.entry_kind === "accrual") {
      paidByMonth.set(key, (paidByMonth.get(key) ?? 0) + 1);
    }
  }

  const monthlyTrend: MonthTrendPoint[] = trendMonths.map((key) => ({
    periodMonth: key,
    label: monthLabel(key),
    clicks: clicksByMonth.get(key) ?? 0,
    signups: signupsByMonth.get(key) ?? 0,
    paidAccruals: paidByMonth.get(key) ?? 0,
    commissionCents: commissionByMonth.get(key) ?? 0,
  }));

  // Demographics from attributed profiles (aggregate only)
  const userIds = [
    ...new Set((allAttrs ?? []).map((row) => row.user_id as string)),
  ];
  const sexCounts = new Map<string, number>();
  const goalCounts = new Map<string, number>();
  const experienceCounts = new Map<string, number>();
  const ageCounts = new Map<string, number>();
  let demographicsSampleSize = 0;

  if (userIds.length > 0) {
    // Chunk to avoid URL length limits
    const chunkSize = 200;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, sex, age, primary_goal, experience_level")
        .in("id", chunk);

      for (const profile of profiles ?? []) {
        demographicsSampleSize += 1;
        const sex = (profile.sex as string | null) ?? "unknown";
        sexCounts.set(sex, (sexCounts.get(sex) ?? 0) + 1);

        const goal = (profile.primary_goal as string | null) ?? "unknown";
        goalCounts.set(goal, (goalCounts.get(goal) ?? 0) + 1);

        const exp = (profile.experience_level as string | null) ?? "unknown";
        experienceCounts.set(exp, (experienceCounts.get(exp) ?? 0) + 1);

        const bucket = ageBucket(
          typeof profile.age === "number" ? profile.age : null
        );
        ageCounts.set(bucket, (ageCounts.get(bucket) ?? 0) + 1);
      }
    }
  }

  const demographicsVisible = demographicsSampleSize >= MIN_DEMOGRAPHIC_SAMPLE;
  const sexBreakdown = demographicsVisible
    ? toNamedCounts(sexCounts, SEX_LABELS, demographicsSampleSize)
    : [];
  const goalBreakdown = demographicsVisible
    ? toNamedCounts(
        goalCounts,
        { ...GOAL_LABELS, unknown: "Not set" },
        demographicsSampleSize
      )
    : [];
  const experienceBreakdown = demographicsVisible
    ? toNamedCounts(
        experienceCounts,
        { ...EXPERIENCE_LABELS, unknown: "Not set" },
        demographicsSampleSize
      )
    : [];
  const ageBreakdown = demographicsVisible
    ? toNamedCounts(ageCounts, AGE_LABELS, demographicsSampleSize)
    : [];

  const tips = buildTips({
    clicks: clickCount,
    signups,
    paidAccruals,
    clickToSignupRate,
    signupToPaidRate,
    sexBreakdown,
    goalBreakdown,
    partnerType,
    clubBreakdownLength: clubBreakdown.length,
  });

  return {
    periodMonth,
    clicks: clickCount,
    signups,
    paidAccruals,
    estimatedCommissionCents,
    pendingCommissionCents,
    lifetimeCommissionCents,
    lifetimeSignups,
    lifetimePaidUsers,
    clickToSignupRate,
    signupToPaidRate,
    codes: (codes ?? []).map((row) => row.code as string),
    trackedLinkPath: `/r/${partnerSlug}`,
    clubBreakdown,
    monthlyTrend,
    sexBreakdown,
    goalBreakdown,
    experienceBreakdown,
    ageBreakdown,
    demographicsSampleSize,
    demographicsVisible,
    tips,
  };
}
