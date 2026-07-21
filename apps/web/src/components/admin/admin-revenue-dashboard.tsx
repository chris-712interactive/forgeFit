import Link from "next/link";
import { AdminRevenueMrrChart } from "@/components/admin/admin-revenue-mrr-chart";
import { AdminRevenueNetChart } from "@/components/admin/admin-revenue-net-chart";
import type { AdminRevenueMetrics } from "@/lib/admin/revenue-metrics";

interface AdminRevenueDashboardProps {
  metrics: AdminRevenueMetrics;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatFetchedAt(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
      <p className="text-xs font-medium text-forge-muted">{label}</p>
      <p className="font-display mt-1 break-words text-2xl font-extrabold text-forge-text sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 break-words text-xs text-forge-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function formatEventSummary(entry: AdminRevenueMetrics["billingEvents"][number]): string {
  const email = entry.targetEmail ?? entry.targetUserId ?? "unknown user";
  if (entry.action === "comp.grant") {
    const tier = entry.payload.tier ?? "tier";
    const expiresAt = entry.payload.expiresAt
      ? new Date(String(entry.payload.expiresAt)).toLocaleDateString()
      : "no expiry";
    return `Comp ${String(tier)} granted — ${email} · expires ${expiresAt}`;
  }
  if (entry.action === "comp.revoke") {
    return `Comp revoked — ${email}`;
  }
  if (entry.action === "discount.apply") {
    const couponId = entry.payload.couponId ?? "coupon";
    return `Discount applied (${String(couponId)}) — ${email}`;
  }
  if (entry.action === "discount.remove") {
    return `Discount removed — ${email}`;
  }
  return entry.action;
}

export function AdminRevenueDashboard({ metrics }: AdminRevenueDashboardProps) {
  const snapshot = metrics.snapshot;
  const stripeLive = metrics.stripeConnected;
  const fetchedAt = formatFetchedAt(metrics.revenueFetchedAt);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Net MRR"
          value={formatUsd(snapshot?.mrrUsd ?? 0)}
          hint={
            stripeLive
              ? `Stripe paid subs only${fetchedAt ? ` · ${fetchedAt}` : ""}`
              : "Connect STRIPE_SECRET_KEY"
          }
        />
        <KpiCard
          label="ARR"
          value={formatUsd(snapshot?.arrUsd ?? 0)}
          hint="MRR × 12"
        />
        <KpiCard
          label="Churn (30d)"
          value={
            metrics.churnRate30d != null ? `${metrics.churnRate30d}%` : "—"
          }
          hint={`${metrics.churned30d} canceled · ${metrics.newPaid30d} new (30d)`}
        />
        <KpiCard
          label="Comp ARR equiv."
          value={formatUsd(metrics.compBreakdown.arrEquivalentUsd)}
          hint={`${metrics.compBreakdown.pro + metrics.compBreakdown.proPlus} comp seat(s)`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="New paid (7d)"
          value={String(metrics.newPaid7d)}
          hint="Recognized Stripe subs created"
        />
        <KpiCard
          label="Net revenue (30d)"
          value={formatUsd(metrics.netRevenue30dUsd)}
          hint="Stripe balance transactions (net)"
        />
        <KpiCard
          label="Past due"
          value={String(snapshot?.pastDueCount ?? 0)}
          hint="Stripe subscriptions"
        />
        <KpiCard
          label="Trialing"
          value={String(snapshot?.trialingCount ?? 0)}
          hint="Active Stripe trials"
        />
      </div>

      {metrics.stripeError ? (
        <div className="rounded-2xl border border-forge-coral/25 bg-forge-coral/5 p-4 text-sm text-forge-muted">
          Stripe API error: {metrics.stripeError}. Revenue KPIs show $0 until the
          request succeeds.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-forge-text">
              Tier & billing interval mix
            </h2>
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              <Link
                href="/api/admin/export/subscriptions"
                className="text-forge-ember hover:underline"
              >
                Subscriptions CSV ↓
              </Link>
              <Link
                href="/api/admin/export/users"
                className="text-forge-ember hover:underline"
              >
                Users CSV ↓
              </Link>
            </div>
          </div>
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-forge-muted">
                  <th className="pb-2 pr-4 font-medium">Tier</th>
                  <th className="pb-2 pr-4 font-medium">Monthly</th>
                  <th className="pb-2 pr-4 font-medium">Annual</th>
                  <th className="pb-2 pr-4 font-medium">Comp</th>
                  <th className="pb-2 font-medium">MRR contrib.</th>
                </tr>
              </thead>
              <tbody>
                {metrics.tierRows.map((row) => (
                  <tr
                    key={row.tier}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-forge-text">
                      {row.tier}
                    </td>
                    <td className="py-3 pr-4 text-forge-muted">{row.monthly}</td>
                    <td className="py-3 pr-4 text-forge-muted">{row.annual}</td>
                    <td className="py-3 pr-4 text-forge-muted">{row.comp}</td>
                    <td className="py-3 font-medium text-forge-text">
                      {formatUsd(row.mrrContributionUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-forge-muted">
            Paid columns from Stripe (comps excluded). Comp column from Supabase
            grants.
            {(snapshot?.excludedCompSubscriptions ?? 0) > 0
              ? ` ${snapshot?.excludedCompSubscriptions} comp-linked Stripe sub(s) excluded from MRR.`
              : null}
            {(snapshot?.unknownPriceCount ?? 0) > 0
              ? ` ${snapshot?.unknownPriceCount} sub(s) use unrecognized price IDs.`
              : null}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-forge-text">
            Recent billing events
          </h2>
          <ul className="mt-4 space-y-3">
            {metrics.billingEvents.length === 0 ? (
              <li className="text-sm text-forge-muted">
                No comp grant/revoke events yet.
              </li>
            ) : (
              metrics.billingEvents.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-white/5 bg-forge-surface px-3 py-2.5 text-sm"
                >
                  <p className="font-medium text-forge-text">
                    {formatEventSummary(entry)}
                  </p>
                  <p className="mt-1 text-xs text-forge-muted">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.createdAt))}
                    {entry.adminEmail ? ` · by ${entry.adminEmail}` : null}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-forge-text">
            MRR trend (90d)
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            One snapshot per day when an admin loads this page.
          </p>
          <div className="mt-4">
            <AdminRevenueMrrChart points={metrics.mrrTrend} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-forge-text">
            Net revenue by week (90d)
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Stripe balance transactions — fees and refunds included in net amount.
          </p>
          <div className="mt-4">
            <AdminRevenueNetChart points={metrics.netRevenueChart} />
          </div>
        </div>
      </div>
    </div>
  );
}
