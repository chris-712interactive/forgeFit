import { getPartnerPortalStats, requirePartnerPortalUser } from "@/lib/partners/portal";
import { getSiteUrl } from "@/lib/seo/site-url";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function PartnerDashboardPage() {
  const ctx = await requirePartnerPortalUser();
  const stats = await getPartnerPortalStats(ctx.partnerId, ctx.partnerSlug);
  const siteUrl = getSiteUrl();
  const fullLink = `${siteUrl}${stats.trackedLinkPath}`;
  const showClubs = ctx.partnerType === "gym" || stats.clubBreakdown.length > 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          {ctx.partnerName}
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Read-only performance for {stats.periodMonth} (UTC). Payouts are handled
          by ForgeRep — you cannot change deals or mark commissions paid here.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-5">
        <h2 className="font-display text-lg font-bold">Your link</h2>
        <p className="mt-2 break-all text-sm text-forge-steel">{fullLink}</p>
        {stats.codes.length > 0 ? (
          <p className="mt-3 text-sm text-forge-muted">
            Promo codes:{" "}
            <span className="font-medium text-forge-text">
              {stats.codes.join(", ")}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-forge-muted">No promo codes yet.</p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Clicks (month)", value: String(stats.clicks) },
          { label: "Signups (month)", value: String(stats.signups) },
          { label: "Paid invoices (month)", value: String(stats.paidAccruals) },
          {
            label: "Est. commission (month)",
            value: usd(stats.estimatedCommissionCents),
          },
          {
            label: "Pending payout",
            value: usd(stats.pendingCommissionCents),
          },
          {
            label: "Lifetime commission",
            value: usd(stats.lifetimeCommissionCents),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4"
          >
            <p className="text-xs text-forge-muted">{card.label}</p>
            <p className="mt-1 font-display text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      {showClubs ? (
        <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-5">
          <h2 className="font-display text-lg font-bold">Club breakdown</h2>
          <p className="mt-1 text-sm text-forge-muted">
            From <code className="text-forge-text">?club=</code> on your tracked
            link (e.g. in-app banners).
          </p>
          {stats.clubBreakdown.length === 0 ? (
            <p className="mt-3 text-sm text-forge-muted">
              No club-tagged clicks this month.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {stats.clubBreakdown.map((row) => (
                <li
                  key={row.club}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-medium">{row.club}</span>
                  <span className="text-forge-muted">
                    {row.clicks} clicks · {row.signups} signups
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
