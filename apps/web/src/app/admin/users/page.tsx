import { AdminUserFilters } from "@/components/admin/admin-user-filters";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { searchAdminUsers } from "@/lib/admin/users";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/billing/types";

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
    tier?: string;
    status?: string;
  }>;
}

function parseTier(value: string | undefined): SubscriptionTier | "comp" | "all" {
  if (
    value === "free" ||
    value === "pro" ||
    value === "pro_plus" ||
    value === "comp"
  ) {
    return value;
  }
  return "all";
}

function parseStatus(
  value: string | undefined
): SubscriptionStatus | "all" {
  if (
    value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "canceled" ||
    value === "inactive"
  ) {
    return value;
  }
  return "all";
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const tier = parseTier(params.tier);
  const status = parseStatus(params.status);

  const users = await searchAdminUsers({
    query: query || undefined,
    tier,
    status,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-forge-text sm:text-3xl">
          Users
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Search members, inspect subscriptions, and grant comp access.
        </p>
      </header>

      <AdminUserFilters query={query} tier={tier} status={status} />
      <AdminUsersTable users={users} />
    </div>
  );
}
