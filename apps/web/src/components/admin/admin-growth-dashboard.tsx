import type { AdminGrowthMetrics } from "@/lib/admin/growth-metrics";

interface AdminGrowthDashboardProps {
  metrics: AdminGrowthMetrics;
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

function formatWeek(iso: string): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AdminGrowthDashboard({ metrics }: AdminGrowthDashboardProps) {
  const maxFunnelCount = Math.max(...metrics.funnel.map((step) => step.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total users" value={String(metrics.totalUsers)} />
        <KpiCard
          label="Signups (7d)"
          value={String(metrics.signups7d)}
          hint="New profiles"
        />
        <KpiCard
          label="Signups (30d)"
          value={String(metrics.signups30d)}
          hint="New profiles"
        />
        <KpiCard
          label="Free → paid"
          value={`${metrics.freeToProConversionPercent}%`}
          hint={`${metrics.paidUsers} paid of ${metrics.totalUsers} total`}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Activation funnel (last 30 days signups)
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Onboarding → first workout → first nutrition log → paid tier.
        </p>
        <ul className="mt-5 space-y-4">
          {metrics.funnel.map((step) => {
            const widthPercent = Math.max(
              8,
              Math.round((step.count / maxFunnelCount) * 100)
            );
            return (
              <li key={step.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-forge-text">{step.label}</span>
                  <span className="font-medium tabular-nums text-forge-text">
                    {step.count}
                    <span className="ml-2 text-xs font-normal text-forge-muted">
                      ({step.rateFromSignup}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forge-ember to-forge-gold"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-forge-text">
            Signup sources
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            From onboarding `signup_source` on profiles.
          </p>
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-forge-muted">
                  <th className="pb-2 pr-4 font-medium">Source</th>
                  <th className="pb-2 pr-4 font-medium">Users</th>
                  <th className="pb-2 font-medium">Paid %</th>
                </tr>
              </thead>
              <tbody>
                {metrics.signupSources.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-forge-muted">
                      No signup source data yet.
                    </td>
                  </tr>
                ) : (
                  metrics.signupSources.slice(0, 12).map((row) => (
                    <tr
                      key={row.source}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium text-forge-text">
                        {row.source}
                      </td>
                      <td className="py-3 pr-4 text-forge-muted">{row.users}</td>
                      <td className="py-3 text-forge-text">{row.paidPercent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-lg font-bold text-forge-text">
            Workout retention cohorts
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            D7/D30 = completed a workout ≥7 or ≥30 days after signup (by cohort
            week).
          </p>
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-forge-muted">
                  <th className="pb-2 pr-4 font-medium">Cohort week</th>
                  <th className="pb-2 pr-4 font-medium">Signups</th>
                  <th className="pb-2 pr-4 font-medium">D7</th>
                  <th className="pb-2 font-medium">D30</th>
                </tr>
              </thead>
              <tbody>
                {metrics.retentionCohorts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-forge-muted">
                      Not enough cohort data yet.
                    </td>
                  </tr>
                ) : (
                  metrics.retentionCohorts.map((row) => (
                    <tr
                      key={row.cohortWeekStart}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium text-forge-text">
                        {formatWeek(row.cohortWeekStart)}
                      </td>
                      <td className="py-3 pr-4 text-forge-muted">
                        {row.signups}
                      </td>
                      <td className="py-3 pr-4 text-forge-text">
                        {row.d7RetentionPercent != null
                          ? `${row.d7RetentionPercent}%`
                          : "—"}
                      </td>
                      <td className="py-3 text-forge-text">
                        {row.d30RetentionPercent != null
                          ? `${row.d30RetentionPercent}%`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
