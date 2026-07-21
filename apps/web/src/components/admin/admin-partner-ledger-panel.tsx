"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminPartnerListItem } from "@/lib/admin/partners";
import type {
  CommissionLedgerRow,
  PartnerMonthSummary,
} from "@/lib/admin/partner-ledger";

interface AdminPartnerLedgerPanelProps {
  partners: AdminPartnerListItem[];
  initialPeriodMonth: string;
  initialLedger: CommissionLedgerRow[];
  initialSummary: PartnerMonthSummary[];
}

function centsToUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AdminPartnerLedgerPanel({
  partners,
  initialPeriodMonth,
  initialLedger,
  initialSummary,
}: AdminPartnerLedgerPanelProps) {
  const router = useRouter();
  const [periodMonth, setPeriodMonth] = useState(initialPeriodMonth);
  const [partnerId, setPartnerId] = useState("");
  const [ledger, setLedger] = useState(initialLedger);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [payoutRef, setPayoutRef] = useState("");

  const querySuffix = useMemo(() => {
    const params = new URLSearchParams({ periodMonth });
    if (partnerId) params.set("partnerId", partnerId);
    return params.toString();
  }, [periodMonth, partnerId]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/admin/partners/ledger?${querySuffix}`);
    const body = (await response.json()) as {
      error?: string;
      ledger?: CommissionLedgerRow[];
      summary?: PartnerMonthSummary[];
    };
    if (!response.ok) {
      setError(body.error ?? "Failed to load ledger.");
      setLoading(false);
      return;
    }
    setLedger(body.ledger ?? []);
    setSummary(body.summary ?? []);
    setLoading(false);
  }

  async function markPaid(targetPartnerId: string) {
    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/partners/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_payout_paid",
        partnerId: targetPartnerId,
        periodMonth,
        externalReference: payoutRef || undefined,
      }),
    });
    const body = (await response.json()) as {
      error?: string;
      amountCents?: number;
      commissionCount?: number;
    };
    if (!response.ok) {
      setError(body.error ?? "Payout failed.");
      setLoading(false);
      return;
    }
    setMessage(
      `Marked ${body.commissionCount} rows paid (${centsToUsd(body.amountCents ?? 0)}).`
    );
    setPayoutRef("");
    await refresh();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-xl border border-forge-success/30 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Commission ledger
        </h2>
        <p className="mt-1 text-sm text-forge-muted">
          Accrues on Stripe <code className="text-forge-text">invoice.paid</code>.
          Export a monthly pack for gym partners, then mark payouts after you send
          money.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-forge-muted">Month (UTC)</span>
            <input
              type="month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="mt-1 block rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
            />
          </label>
          <label className="block text-sm">
            <span className="text-forge-muted">Partner</span>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="mt-1 block w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text sm:min-w-[12rem]"
            >
              <option value="">All partners</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.displayName}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void refresh()}
            className="rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Refresh
          </button>
          <a
            href={`/api/admin/export/partner-commissions?${querySuffix}`}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-forge-text hover:bg-white/5"
          >
            Export summary CSV
          </a>
          <a
            href={`/api/admin/export/partner-commissions?${querySuffix}&detail=1`}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-forge-text hover:bg-white/5"
          >
            Export detail CSV
          </a>
        </div>

        <div className="mt-4 max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-forge-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Partner</th>
                <th className="py-2 pr-4 font-medium">Signups</th>
                <th className="py-2 pr-4 font-medium">Paid invoices</th>
                <th className="py-2 pr-4 font-medium">Commission</th>
                <th className="py-2 pr-4 font-medium">Pending</th>
                <th className="py-2 font-medium">Payout</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-forge-muted">
                    No partner activity this month.
                  </td>
                </tr>
              ) : (
                summary.map((row) => (
                  <tr key={row.partnerId} className="border-t border-white/10">
                    <td className="py-3 pr-4 text-forge-text">
                      {row.partnerName}{" "}
                      <span className="text-forge-muted">({row.partnerSlug})</span>
                    </td>
                    <td className="py-3 pr-4">{row.attributedSignups}</td>
                    <td className="py-3 pr-4">{row.accrualCount}</td>
                    <td className="py-3 pr-4">
                      {centsToUsd(row.commissionCents)}
                    </td>
                    <td className="py-3 pr-4">{centsToUsd(row.pendingCents)}</td>
                    <td className="py-3">
                      {row.pendingCents !== 0 ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void markPaid(row.partnerId)}
                          className="rounded-lg border border-forge-ember/40 px-2.5 py-1 text-xs font-medium text-forge-ember"
                        >
                          Mark paid
                        </button>
                      ) : (
                        <span className="text-forge-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <label className="mt-4 block text-sm">
          <span className="text-forge-muted">
            Optional payout reference (ACH / PayPal id)
          </span>
          <input
            value={payoutRef}
            onChange={(e) => setPayoutRef(e.target.value)}
            className="mt-1 w-full max-w-md rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-forge-text"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Recent ledger rows
        </h2>
        <ul className="mt-3 divide-y divide-white/10">
          {ledger.length === 0 ? (
            <li className="py-3 text-sm text-forge-muted">No rows.</li>
          ) : (
            ledger.slice(0, 40).map((row) => (
              <li key={row.id} className="py-3 text-sm">
                <p className="text-forge-text">
                  {row.partnerSlug} · {row.entryKind} ·{" "}
                  <span
                    className={
                      row.commissionCents < 0
                        ? "text-forge-coral"
                        : "text-forge-success"
                    }
                  >
                    {centsToUsd(row.commissionCents)}
                  </span>{" "}
                  <span className="text-forge-muted">({row.status})</span>
                </p>
                <p className="mt-0.5 text-forge-muted">
                  {row.userEmail ?? row.userId.slice(0, 8)} · {row.tier ?? "—"} ·{" "}
                  {row.stripeInvoiceId ?? "no invoice"}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
