import type { AdminOverviewMetrics } from "@/lib/admin/metrics";

interface AdminOverviewCardsProps {
  metrics: AdminOverviewMetrics;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
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
    <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
      <p className="text-xs font-medium text-forge-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold text-forge-text sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-forge-muted">{hint}</p> : null}
    </div>
  );
}

export function AdminOverviewCards({ metrics }: AdminOverviewCardsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Est. MRR"
          value={formatUsd(metrics.estimatedMrrUsd)}
          hint="Paid Stripe subs at monthly list price"
        />
        <KpiCard
          label="Est. ARR"
          value={formatUsd(metrics.estimatedArrUsd)}
          hint="MRR × 12"
        />
        <KpiCard
          label="Paid subscribers"
          value={String(metrics.paidSubscribers)}
          hint={`Pro ${metrics.proCount} · Pro+ ${metrics.proPlusCount}`}
        />
        <KpiCard
          label="Total users"
          value={String(metrics.totalUsers)}
          hint={`${metrics.signupsLast30Days} signups (30d)`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Comp accounts"
          value={String(metrics.compCount)}
          hint="Admin-granted, no charge"
        />
        <KpiCard
          label="Past due"
          value={String(metrics.pastDueCount)}
          hint="Stripe billing issues"
        />
        <div className="rounded-2xl border border-forge-gold/25 bg-forge-gold/5 p-4 sm:p-5">
          <p className="text-xs font-medium text-forge-gold">Note</p>
          <p className="mt-2 text-sm text-forge-muted">
            MRR is estimated from active paid tiers at monthly list price.
            Annual subscribers and coupons are not reflected yet (Phase B).
          </p>
        </div>
      </div>
    </div>
  );
}
