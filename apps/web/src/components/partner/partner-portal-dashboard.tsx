"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartShell } from "@/components/progress/chart-shell";
import { CHART_COLORS } from "@/components/progress/chart-colors";
import type { PartnerPortalStats } from "@/lib/partners/portal-stats";

const PIE_COLORS = [
  CHART_COLORS.ember,
  CHART_COLORS.steel,
  CHART_COLORS.gold,
  "#a78bfa",
  "#34d399",
  CHART_COLORS.muted,
];

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function rateLabel(rate: number | null): string {
  if (rate == null) return "—";
  return `${rate}%`;
}

interface PartnerPortalDashboardProps {
  partnerName: string;
  partnerType: string;
  fullLink: string;
  stats: PartnerPortalStats;
}

export function PartnerPortalDashboard({
  partnerName,
  partnerType,
  fullLink,
  stats,
}: PartnerPortalDashboardProps) {
  const [copied, setCopied] = useState(false);
  const showClubs = partnerType === "gym" || stats.clubBreakdown.length > 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const trendHasData = stats.monthlyTrend.some(
    (row) => row.clicks > 0 || row.signups > 0 || row.paidAccruals > 0
  );

  const commissionTrend = stats.monthlyTrend.map((row) => ({
    ...row,
    commission: Math.round(row.commissionCents) / 100,
  }));

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-forge-ember/20 via-forge-surface-raised to-forge-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-forge-gold/10 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forge-gold">
          Partner growth
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
          {partnerName}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-forge-muted">
          Performance for {stats.periodMonth} (UTC) plus audience insights from
          members who signed up through your link. Aggregates only — no personal
          data.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Your tracked link</h2>
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
          </div>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Clicks (month)", value: String(stats.clicks) },
          { label: "Signups (month)", value: String(stats.signups) },
          { label: "Paid invoices (month)", value: String(stats.paidAccruals) },
          {
            label: "Click → signup",
            value: rateLabel(stats.clickToSignupRate),
          },
          {
            label: "Signup → paid",
            value: rateLabel(stats.signupToPaidRate),
          },
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
          {
            label: "Lifetime referred members",
            value: String(stats.lifetimeSignups),
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

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-5">
        <h2 className="font-display text-lg font-bold">6-month trend</h2>
        <p className="mt-1 text-sm text-forge-muted">
          Clicks, signups, and paid conversions attributed to you.
        </p>
        {!trendHasData ? (
          <p className="mt-6 text-sm text-forge-muted">
            Charts appear after your first tracked clicks and signups.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            <ChartShell height={220}>
              {({ width, height }) => (
                <ResponsiveContainer width={width} height={height}>
                  <AreaChart
                    data={stats.monthlyTrend}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="partnerClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={CHART_COLORS.ember}
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="100%"
                          stopColor={CHART_COLORS.ember}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        background: CHART_COLORS.surface,
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke={CHART_COLORS.ember}
                      fill="url(#partnerClicks)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      name="Signups"
                      stroke={CHART_COLORS.steel}
                      fill="transparent"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="paidAccruals"
                      name="Paid"
                      stroke={CHART_COLORS.gold}
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartShell>

            <div>
              <p className="mb-2 text-xs font-medium text-forge-muted">
                Commission ($ / month)
              </p>
              <ChartShell height={160}>
                {({ width, height }) => (
                  <ResponsiveContainer width={width} height={height}>
                    <BarChart
                      data={commissionTrend}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Commission"]}
                        contentStyle={{
                          background: CHART_COLORS.surface,
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                        }}
                      />
                      <Bar
                        dataKey="commission"
                        fill={CHART_COLORS.gold}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartShell>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-5">
        <h2 className="font-display text-lg font-bold">Who you’re referring</h2>
        <p className="mt-1 text-sm text-forge-muted">
          From onboarding answers on attributed accounts (sex, goal, experience,
          age). Shown only with enough sample size to protect privacy.
        </p>

        {!stats.demographicsVisible ? (
          <p className="mt-6 text-sm text-forge-muted">
            Need at least {5} attributed members with profiles before audience
            charts unlock (currently {stats.demographicsSampleSize}).
          </p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <BreakdownChart
              title="Men vs women"
              data={stats.sexBreakdown}
              empty="No sex data yet."
            />
            <BreakdownChart
              title="Primary goal"
              data={stats.goalBreakdown}
              empty="No goal data yet."
            />
            <BreakdownChart
              title="Experience level"
              data={stats.experienceBreakdown}
              empty="No experience data yet."
            />
            <BreakdownChart
              title="Age bands"
              data={stats.ageBreakdown}
              empty="No age data yet."
              mode="bar"
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-forge-gold/20 bg-forge-gold/5 p-5">
        <h2 className="font-display text-lg font-bold text-forge-gold">
          Grow your referrals
        </h2>
        <ul className="mt-3 space-y-2">
          {stats.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-forge-text">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forge-gold" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {showClubs ? (
        <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-5">
          <h2 className="font-display text-lg font-bold">Club breakdown</h2>
          <p className="mt-1 text-sm text-forge-muted">
            From <code className="text-forge-text">?club=</code> on your tracked
            link.
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

function BreakdownChart({
  title,
  data,
  empty,
  mode = "pie",
}: {
  title: string;
  data: PartnerPortalStats["sexBreakdown"];
  empty: string;
  mode?: "pie" | "bar";
}) {
  if (data.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-forge-text">{title}</h3>
        <p className="mt-3 text-sm text-forge-muted">{empty}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-forge-text">{title}</h3>
      <ChartShell height={200}>
        {({ width, height }) =>
          mode === "bar" ? (
            <ResponsiveContainer width={width} height={height}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={72}
                  tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value} (${(item?.payload as { percent?: number })?.percent ?? 0}%)`,
                    "Members",
                  ]}
                  contentStyle={{
                    background: CHART_COLORS.surface,
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width={width} height={height}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, item) => [
                    `${value} (${(item?.payload as { percent?: number })?.percent ?? 0}%)`,
                    name,
                  ]}
                  contentStyle={{
                    background: CHART_COLORS.surface,
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )
        }
      </ChartShell>
      <ul className="mt-2 space-y-1">
        {data.map((row, index) => (
          <li
            key={row.key}
            className="flex items-center justify-between text-xs text-forge-muted"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              {row.label}
            </span>
            <span>
              {row.count} · {row.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
