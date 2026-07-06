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
  const stripeLive = metrics.revenueSource === "stripe" && metrics.stripeConnected;
  const intervalHint = stripeLive
    ? `Pro ${metrics.proCount} (${metrics.proMonthlyCount}mo · ${metrics.proAnnualCount}yr) · Pro+ ${metrics.proPlusCount} (${metrics.proPlusMonthlyCount}mo · ${metrics.proPlusAnnualCount}yr)`
    : "Requires Stripe API (STRIPE_SECRET_KEY)";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="MRR"
          value={formatUsd(metrics.mrrUsd)}
          hint={
            stripeLive
              ? "From Stripe subscriptions only"
              : "Stripe unavailable — shows $0 until connected"
          }
        />
        <KpiCard
          label="ARR"
          value={formatUsd(metrics.arrUsd)}
          hint={stripeLive ? "MRR × 12" : "Stripe source of truth for revenue"}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Comp accounts"
          value={String(metrics.compCount)}
          hint="DB-granted access — not counted in MRR"
        />
        <KpiCard
          label="Profile-paid (no Stripe)"
          value={String(metrics.profilePaidWithoutStripe)}
          hint="Active tier in DB without a Stripe subscription"
        />
        <KpiCard
          label="Past due"
          value={String(metrics.pastDueCount)}
          hint={
            stripeLive
              ? "Stripe subscriptions with failed payment"
              : "From Stripe when connected"
          }
        />
        <KpiCard
          label="Trialing"
          value={String(metrics.trialingCount)}
          hint={stripeLive ? "Active Stripe trials" : "From Stripe when connected"}
        />
      </div>

      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          stripeLive
            ? "border-forge-steel/25 bg-forge-steel/5"
            : metrics.stripeError
              ? "border-forge-coral/25 bg-forge-coral/5"
              : "border-forge-gold/25 bg-forge-gold/5"
        }`}
      >
        <p
          className={`text-xs font-medium ${
            stripeLive
              ? "text-forge-steel"
              : metrics.stripeError
                ? "text-forge-coral"
                : "text-forge-gold"
          }`}
        >
          Revenue source
        </p>
        <p className="mt-2 text-sm text-forge-muted">
          {metrics.stripeError ? (
            <>
              Stripe API error: {metrics.stripeError}. Paid counts and MRR show $0
              until the request succeeds. Comp and profile-paid counts still come
              from Supabase.
            </>
          ) : stripeLive ? (
            <>
              Paid subscribers and MRR come{" "}
              <span className="font-medium text-forge-text">only</span> from Stripe
              — profile tiers and comp grants do not add revenue. Comp seats are
              tracked separately.
              {stripeHint ? ` ${stripeHint}.` : null}
              {metrics.unknownPriceCount > 0
                ? ` ${metrics.unknownPriceCount} Stripe subscription(s) use unrecognized price IDs and are excluded from MRR.`
                : null}
              {metrics.excludedCompSubscriptions > 0
                ? ` ${metrics.excludedCompSubscriptions} Stripe subscription(s) belong to comp accounts and are excluded from MRR.`
                : null}
              {metrics.profilePaidWithoutStripe > 0
                ? ` ${metrics.profilePaidWithoutStripe} user(s) have paid tier access in the database without a Stripe subscription (comps excluded).`
                : null}
            </>
          ) : (
            <>
              Set <code className="text-forge-text">STRIPE_SECRET_KEY</code> to load
              live subscription metrics. Revenue KPIs stay at $0 — never estimated from
              profile tiers. Comp accounts still come from Supabase.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
