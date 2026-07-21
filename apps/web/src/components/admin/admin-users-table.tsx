import Link from "next/link";
import type { AdminUserRow } from "@/lib/admin/users";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/billing/types";

function TierBadge({
  tier,
  billingSource,
}: {
  tier: SubscriptionTier;
  billingSource: string | null;
}) {
  if (billingSource === "comp") {
    const label = tier === "pro_plus" ? "Pro+ comp" : tier === "pro" ? "Pro comp" : "Comp";
    return (
      <span className="rounded-full bg-forge-steel/15 px-2 py-0.5 text-xs font-semibold text-forge-steel">
        {label}
      </span>
    );
  }

  if (tier === "pro_plus") {
    return (
      <span className="rounded-full bg-forge-gold/15 px-2 py-0.5 text-xs font-semibold text-forge-gold">
        Pro+
      </span>
    );
  }
  if (tier === "pro") {
    return (
      <span className="rounded-full bg-forge-ember/15 px-2 py-0.5 text-xs font-semibold text-forge-glow">
        Pro
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-forge-muted">
      Free
    </span>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  if (status === "active" || status === "trialing") {
    return (
      <span className="rounded-full bg-forge-success/15 px-2 py-0.5 text-xs font-semibold text-forge-success">
        {status}
      </span>
    );
  }
  if (status === "past_due") {
    return (
      <span className="rounded-full bg-forge-coral/15 px-2 py-0.5 text-xs font-semibold text-forge-coral">
        past due
      </span>
    );
  }
  if (status === "canceled") {
    return (
      <span className="text-xs text-forge-muted">canceled</span>
    );
  }
  return <span className="text-xs text-forge-muted">—</span>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface AdminUsersTableProps {
  users: AdminUserRow[];
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-8 text-center text-sm text-forge-muted">
        No users match your filters.
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-forge-surface-raised">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-forge-muted">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Tier</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="break-all font-medium text-forge-text hover:text-forge-ember"
                  >
                    {user.email ?? "No email"}
                  </Link>
                  <p className="text-xs text-forge-muted">
                    {user.displayName ?? "—"} · {user.id.slice(0, 8)}…
                  </p>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={user.tier} billingSource={user.billingSource} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-forge-muted">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
