import { createAdminClient } from "@/lib/supabase/admin";

export interface UserExportRow {
  id: string;
  email: string;
  displayName: string;
  tier: string;
  status: string;
  billingSource: string;
  signupSource: string;
  onboardingComplete: boolean;
  createdAt: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  compExpiresAt: string;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function buildUserExportRows(): Promise<UserExportRow[]> {
  const admin = createAdminClient();
  const rows: UserExportRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id, email, display_name, subscription_tier, subscription_status, billing_source, signup_source, onboarding_complete, created_at, stripe_customer_id, stripe_subscription_id, comp_expires_at"
      )
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("user export failed:", error.message);
      break;
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      rows.push({
        id: row.id as string,
        email: (row.email as string | null) ?? "",
        displayName: (row.display_name as string | null) ?? "",
        tier: (row.subscription_tier as string | null) ?? "free",
        status: (row.subscription_status as string | null) ?? "inactive",
        billingSource: (row.billing_source as string | null) ?? "",
        signupSource: (row.signup_source as string | null) ?? "",
        onboardingComplete: Boolean(row.onboarding_complete),
        createdAt: row.created_at as string,
        stripeCustomerId: (row.stripe_customer_id as string | null) ?? "",
        stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? "",
        compExpiresAt: (row.comp_expires_at as string | null) ?? "",
      });
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

export function userRowsToCsv(rows: UserExportRow[]): string {
  const header =
    "id,email,display_name,tier,status,billing_source,signup_source,onboarding_complete,created_at,stripe_customer_id,stripe_subscription_id,comp_expires_at";

  const lines = rows.map((row) =>
    [
      csvEscape(row.id),
      csvEscape(row.email),
      csvEscape(row.displayName),
      csvEscape(row.tier),
      csvEscape(row.status),
      csvEscape(row.billingSource),
      csvEscape(row.signupSource),
      row.onboardingComplete ? "true" : "false",
      csvEscape(row.createdAt),
      csvEscape(row.stripeCustomerId),
      csvEscape(row.stripeSubscriptionId),
      csvEscape(row.compExpiresAt),
    ].join(",")
  );

  return [header, ...lines].join("\n");
}
