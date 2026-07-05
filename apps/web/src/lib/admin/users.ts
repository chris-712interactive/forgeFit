import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SubscriptionStatus,
  SubscriptionTier,
} from "@/lib/billing/types";

export interface AdminUserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingSource: string | null;
  compExpiresAt: string | null;
  createdAt: string;
  onboardingComplete: boolean;
  signupSource: string | null;
}

export interface AdminUserDetail extends AdminUserRow {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  compReason: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  gamificationOptIn: boolean;
  workoutCount: number;
}

export interface AdminUserSearchFilters {
  query?: string;
  tier?: SubscriptionTier | "comp" | "all";
  status?: SubscriptionStatus | "all";
  limit?: number;
}

function mapProfileRow(row: Record<string, unknown>): AdminUserRow {
  return {
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    tier: (row.subscription_tier as SubscriptionTier) ?? "free",
    status: (row.subscription_status as SubscriptionStatus) ?? "inactive",
    billingSource: (row.billing_source as string | null) ?? null,
    compExpiresAt: (row.comp_expires_at as string | null) ?? null,
    createdAt: row.created_at as string,
    onboardingComplete: Boolean(row.onboarding_complete),
    signupSource: (row.signup_source as string | null) ?? null,
  };
}

export async function searchAdminUsers(
  filters: AdminUserSearchFilters
): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const limit = filters.limit ?? 50;

  let query = admin
    .from("profiles")
    .select(
      "id, email, display_name, subscription_tier, subscription_status, billing_source, comp_expires_at, created_at, onboarding_complete, signup_source"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const q = filters.query?.trim();
  if (q) {
    const escaped = q.replace(/[%_]/g, "\\$&");
    if (/^[0-9a-f-]{36}$/i.test(q)) {
      query = query.eq("id", q);
    } else {
      query = query.or(
        `email.ilike.%${escaped}%,display_name.ilike.%${escaped}%`
      );
    }
  }

  if (filters.tier && filters.tier !== "all") {
    if (filters.tier === "comp") {
      query = query.eq("billing_source", "comp");
    } else {
      query = query.eq("subscription_tier", filters.tier);
    }
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("subscription_status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("admin user search failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapProfileRow(row as Record<string, unknown>));
}

export async function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, email, display_name, subscription_tier, subscription_status, billing_source, comp_reason, comp_expires_at, created_at, onboarding_complete, signup_source, stripe_customer_id, stripe_subscription_id, subscription_current_period_end, gamification_opt_in"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  let workoutCount = 0;
  const sessionsResult = await admin
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!sessionsResult.error) {
    workoutCount = sessionsResult.count ?? 0;
  }

  const base = mapProfileRow(profile as Record<string, unknown>);
  return {
    ...base,
    compReason: (profile.comp_reason as string | null) ?? null,
    stripeCustomerId: (profile.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId:
      (profile.stripe_subscription_id as string | null) ?? null,
    subscriptionCurrentPeriodEnd:
      (profile.subscription_current_period_end as string | null) ?? null,
    gamificationOptIn: Boolean(profile.gamification_opt_in),
    workoutCount,
  };
}
