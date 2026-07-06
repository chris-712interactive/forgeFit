import type { AdminOverviewMetrics } from "@/lib/admin/metrics";

interface AdminOverviewCardsProps {
  metrics: AdminOverviewMetrics;
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
  return `Stripe data · ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))}`;
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
  const stripeHint = formatFetchedAt(metrics.revenueFetchedAt);
  const intervalHint = metrics.stripeConnected
    ? `Pro ${metrics.proCount} (${metrics.proMonthlyCount}mo · ${metrics.proAnnualCount}yr) · Pro+ ${metrics.proPlusCount} (${metrics.proPlusMonthlyCount}mo · ${metrics.proPlusAnnualCount}yr)`
    : `Pro ${metrics.proCount} · Pro+ ${metrics.proPlusCount}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={metrics.stripeConnected ? "MRR" : "Est. MRR"}
          value={formatUsd(metrics.mrrUsd)}
          hint={
            metrics.stripeConnected
              ? "Normalized monthly revenue from Stripe subs"
              : "Profile tiers at monthly list price (Stripe unavailable)"
          }
        />
        <KpiCard
          label={metrics.stripeConnected ? "ARR" : "Est. ARR"}
          value={formatUsd(metrics.arrUsd)}
          hint={metrics.stripeConnected ? "MRR × 12" : "Estimate only"}
        />
        <KpiCard
          label="Paid subscribers"
          value={String(metrics.paidSubscribers)}
          hint={intervalHint}
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
          hint={
            metrics.stripeConnected
              ? "Stripe subscriptions with failed payment"
              : "From profile subscription status"
          }
        />
        <KpiCard
          label="Trialing"
          value={String(metrics.trialingCount)}
          hint={
            metrics.stripeConnected
              ? "Active Stripe trials"
              : "Requires Stripe connection"
          }
        />
      </div>

      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          metrics.stripeConnected
            ? "border-forge-steel/25 bg-forge-steel/5"
            : "border-forge-gold/25 bg-forge-gold/5"
        }`}
      >
        <p
          className={`text-xs font-medium ${
            metrics.stripeConnected ? "text-forge-steel" : "text-forge-gold"
          }`}
        >
          Revenue source
        </p>
        <p className="mt-2 text-sm text-forge-muted">
          {metrics.stripeConnected ? (
            <>
              Paid counts and MRR come from live Stripe subscriptions (monthly and
              annual prices normalized to MRR, including coupons). Comp seats still
              come from Supabase.
              {stripeHint ? ` ${stripeHint}.` : null}
              {metrics.unknownPriceCount > 0
                ? ` ${metrics.unknownPriceCount} subscription(s) use unrecognized price IDs.`
                : null}
            </>
          ) : (
            <>
              Stripe is not fully configured in this environment. Revenue KPIs fall
              back to active paid tiers on profiles at monthly list price — configure{" "}
              <code className="text-forge-text">STRIPE_SECRET_KEY</code> and price
              IDs for accurate metrics.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
