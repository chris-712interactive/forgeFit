import Link from "next/link";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/billing/types";

interface AdminUserFiltersProps {
  query: string;
  tier: SubscriptionTier | "comp" | "all";
  status: SubscriptionStatus | "all";
}

export function AdminUserFilters({
  query,
  tier,
  status,
}: AdminUserFiltersProps) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex min-w-0 w-full flex-1 flex-col gap-1 text-xs font-medium text-forge-muted sm:min-w-[220px]">
        Search
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Email, name, or user ID"
          className="w-full min-w-0 rounded-xl border border-white/10 bg-forge-surface px-3 py-2.5 text-sm text-forge-text outline-none ring-forge-ember/40 focus:ring-2"
        />
      </label>

      <label className="flex w-full flex-col gap-1 text-xs font-medium text-forge-muted sm:w-36">
        Tier
        <select
          name="tier"
          defaultValue={tier}
          className="rounded-xl border border-white/10 bg-forge-surface px-3 py-2.5 text-sm text-forge-text"
        >
          <option value="all">All tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="pro_plus">Pro+</option>
          <option value="comp">Comp</option>
        </select>
      </label>

      <label className="flex w-full flex-col gap-1 text-xs font-medium text-forge-muted sm:w-36">
        Status
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-white/10 bg-forge-surface px-3 py-2.5 text-sm text-forge-text"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-bold text-white hover:bg-forge-glow"
        >
          Search
        </button>
        <Link
          href="/admin/users"
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-forge-muted hover:text-forge-text"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
