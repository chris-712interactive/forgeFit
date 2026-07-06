import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/billing/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

export interface GrowthFunnelStep {
  label: string;
  count: number;
  rateFromSignup: number;
}

export interface SignupSourceRow {
  source: string;
  users: number;
  paidUsers: number;
  paidPercent: number;
}

export interface RetentionCohortRow {
  cohortWeekStart: string;
  signups: number;
  d7RetentionPercent: number | null;
  d30RetentionPercent: number | null;
}

export interface AdminGrowthMetrics {
  totalUsers: number;
  signups7d: number;
  signups30d: number;
  freeToProConversionPercent: number;
  paidUsers: number;
  funnel: GrowthFunnelStep[];
  signupSources: SignupSourceRow[];
  retentionCohorts: RetentionCohortRow[];
}

interface ProfileGrowthRow {
  id: string;
  createdAt: string;
  onboardingComplete: boolean;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
}

interface CacheEntry {
  expiresAt: number;
  metrics: AdminGrowthMetrics;
}

let growthCache: CacheEntry | null = null;

function isPaidUser(tier: SubscriptionTier, status: SubscriptionStatus): boolean {
  return (
    (tier === "pro" || tier === "pro_plus") &&
    (status === "active" || status === "trialing")
  );
}

function startOfUtcWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function weekKey(date: Date): string {
  return startOfUtcWeek(date).toISOString().slice(0, 10);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchUserIdSetWithCompletedWorkouts(
  userIds: string[]
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const admin = createAdminClient();
  const result = new Set<string>();

  for (const batch of chunk(userIds, 200)) {
    const { data, error } = await admin
      .from("workout_sessions")
      .select("user_id")
      .eq("status", "completed")
      .in("user_id", batch);

    if (error) {
      console.error("growth workout fetch failed:", error.message);
      continue;
    }

    for (const row of data ?? []) {
      result.add(row.user_id as string);
    }
  }

  return result;
}

async function fetchUserIdSetWithNutritionLogs(
  userIds: string[]
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const admin = createAdminClient();
  const result = new Set<string>();

  for (const batch of chunk(userIds, 200)) {
    const { data, error } = await admin
      .from("nutrition_logs")
      .select("user_id")
      .in("user_id", batch);

    if (error) {
      console.error("growth nutrition fetch failed:", error.message);
      continue;
    }

    for (const row of data ?? []) {
      result.add(row.user_id as string);
    }
  }

  return result;
}

async function fetchWorkoutCompletionsForUsers(
  userIds: string[]
): Promise<Map<string, string[]>> {
  const completions = new Map<string, string[]>();
  if (userIds.length === 0) return completions;

  const admin = createAdminClient();

  for (const batch of chunk(userIds, 200)) {
    const { data, error } = await admin
      .from("workout_sessions")
      .select("user_id, completed_at")
      .eq("status", "completed")
      .in("user_id", batch)
      .not("completed_at", "is", null);

    if (error) {
      console.error("growth workout completion fetch failed:", error.message);
      continue;
    }

    for (const row of data ?? []) {
      const userId = row.user_id as string;
      const completedAt = row.completed_at as string;
      const existing = completions.get(userId) ?? [];
      existing.push(completedAt);
      completions.set(userId, existing);
    }
  }

  return completions;
}

function buildSignupSources(
  profiles: Array<ProfileGrowthRow & { signupSource: string | null }>
): SignupSourceRow[] {
  const bySource = new Map<string, { users: number; paidUsers: number }>();

  for (const profile of profiles) {
    const source = profile.signupSource?.trim() || "Not set";
    const entry = bySource.get(source) ?? { users: 0, paidUsers: 0 };
    entry.users += 1;
    if (isPaidUser(profile.tier, profile.status)) {
      entry.paidUsers += 1;
    }
    bySource.set(source, entry);
  }

  return [...bySource.entries()]
    .map(([source, stats]) => ({
      source,
      users: stats.users,
      paidUsers: stats.paidUsers,
      paidPercent:
        stats.users > 0
          ? Math.round((stats.paidUsers / stats.users) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.users - a.users);
}

function buildRetentionCohorts(
  profiles: ProfileGrowthRow[],
  workoutCompletions: Map<string, string[]>,
  cohortWeeks = 8
): RetentionCohortRow[] {
  const now = Date.now();
  const msDay = 24 * 60 * 60 * 1000;
  const cohortMap = new Map<string, ProfileGrowthRow[]>();

  for (const profile of profiles) {
    const key = weekKey(new Date(profile.createdAt));
    const bucket = cohortMap.get(key) ?? [];
    bucket.push(profile);
    cohortMap.set(key, bucket);
  }

  const sortedWeeks = [...cohortMap.keys()].sort((a, b) => b.localeCompare(a));
  const rows: RetentionCohortRow[] = [];

  for (const cohortWeekStart of sortedWeeks.slice(0, cohortWeeks)) {
    const cohortProfiles = cohortMap.get(cohortWeekStart) ?? [];
    const signups = cohortProfiles.length;
    if (signups === 0) continue;

    const cohortStartMs = new Date(`${cohortWeekStart}T00:00:00.000Z`).getTime();
    const cohortAgeDays = (now - cohortStartMs) / msDay;

    let d7Count = 0;
    let d30Count = 0;

    for (const profile of cohortProfiles) {
      const signupMs = new Date(profile.createdAt).getTime();
      const completions = workoutCompletions.get(profile.id) ?? [];

      for (const completedAt of completions) {
        const daysAfterSignup =
          (new Date(completedAt).getTime() - signupMs) / msDay;
        if (daysAfterSignup >= 7) {
          d7Count += 1;
          break;
        }
      }

      for (const completedAt of completions) {
        const daysAfterSignup =
          (new Date(completedAt).getTime() - signupMs) / msDay;
        if (daysAfterSignup >= 30) {
          d30Count += 1;
          break;
        }
      }
    }

    rows.push({
      cohortWeekStart,
      signups,
      d7RetentionPercent:
        cohortAgeDays >= 7
          ? Math.round((d7Count / signups) * 1000) / 10
          : null,
      d30RetentionPercent:
        cohortAgeDays >= 30
          ? Math.round((d30Count / signups) * 1000) / 10
          : null,
    });
  }

  return rows;
}

async function computeGrowthMetrics(): Promise<AdminGrowthMetrics> {
  const admin = createAdminClient();
  const now = Date.now();
  const msDay = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now - 7 * msDay).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * msDay).toISOString();
  const sixteenWeeksAgo = new Date(now - 16 * 7 * msDay);

  const { data: profileRows, error } = await admin
    .from("profiles")
    .select(
      "id, created_at, onboarding_complete, subscription_tier, subscription_status, signup_source"
    );

  if (error) {
    console.error("growth metrics profile query failed:", error.message);
    return {
      totalUsers: 0,
      signups7d: 0,
      signups30d: 0,
      freeToProConversionPercent: 0,
      paidUsers: 0,
      funnel: [],
      signupSources: [],
      retentionCohorts: [],
    };
  }

  const profiles = (profileRows ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    onboardingComplete: Boolean(row.onboarding_complete),
    tier: (row.subscription_tier as SubscriptionTier) ?? "free",
    status: (row.subscription_status as SubscriptionStatus) ?? "inactive",
    signupSource: (row.signup_source as string | null) ?? null,
  }));

  const totalUsers = profiles.length;
  let signups7d = 0;
  let signups30d = 0;
  let paidUsers = 0;

  const recentSignupProfiles: ProfileGrowthRow[] = [];
  const cohortProfiles: ProfileGrowthRow[] = [];

  for (const profile of profiles) {
    if (isPaidUser(profile.tier, profile.status)) {
      paidUsers += 1;
    }

    const createdMs = new Date(profile.createdAt).getTime();
    if (createdMs >= new Date(sevenDaysAgo).getTime()) {
      signups7d += 1;
    }
    if (createdMs >= new Date(thirtyDaysAgo).getTime()) {
      signups30d += 1;
      recentSignupProfiles.push(profile);
    }
    if (createdMs >= sixteenWeeksAgo.getTime()) {
      cohortProfiles.push(profile);
    }
  }

  const recentSignupIds = recentSignupProfiles.map((profile) => profile.id);
  const [workoutUsers, nutritionUsers] = await Promise.all([
    fetchUserIdSetWithCompletedWorkouts(recentSignupIds),
    fetchUserIdSetWithNutritionLogs(recentSignupIds),
  ]);

  const signedUp = recentSignupProfiles.length;
  const onboardingDone = recentSignupProfiles.filter(
    (profile) => profile.onboardingComplete
  ).length;
  const firstWorkout = recentSignupProfiles.filter((profile) =>
    workoutUsers.has(profile.id)
  ).length;
  const firstNutrition = recentSignupProfiles.filter((profile) =>
    nutritionUsers.has(profile.id)
  ).length;
  const upgradedPaid = recentSignupProfiles.filter((profile) =>
    isPaidUser(profile.tier, profile.status)
  ).length;

  const funnelSteps = [
    { label: "Signed up", count: signedUp },
    { label: "Onboarding done", count: onboardingDone },
    { label: "First workout", count: firstWorkout },
    { label: "First nutrition log", count: firstNutrition },
    { label: "Upgraded to paid", count: upgradedPaid },
  ];

  const funnel: GrowthFunnelStep[] = funnelSteps.map((step) => ({
    label: step.label,
    count: step.count,
    rateFromSignup:
      signedUp > 0 ? Math.round((step.count / signedUp) * 1000) / 10 : 0,
  }));

  const cohortUserIds = cohortProfiles.map((profile) => profile.id);
  const workoutCompletions = await fetchWorkoutCompletionsForUsers(cohortUserIds);

  return {
    totalUsers,
    signups7d,
    signups30d,
    paidUsers,
    freeToProConversionPercent:
      totalUsers > 0
        ? Math.round((paidUsers / totalUsers) * 1000) / 10
        : 0,
    funnel,
    signupSources: buildSignupSources(profiles),
    retentionCohorts: buildRetentionCohorts(
      cohortProfiles,
      workoutCompletions
    ),
  };
}

export async function getAdminGrowthMetrics(): Promise<AdminGrowthMetrics> {
  const now = Date.now();
  if (growthCache && growthCache.expiresAt > now) {
    return growthCache.metrics;
  }

  const metrics = await computeGrowthMetrics();
  growthCache = {
    expiresAt: now + CACHE_TTL_MS,
    metrics,
  };

  return metrics;
}
