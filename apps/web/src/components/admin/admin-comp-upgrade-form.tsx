"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminUserDetail } from "@/lib/admin/users";

interface AdminCompUpgradeFormProps {
  user: AdminUserDetail;
}

export function AdminCompUpgradeForm({ user }: AdminCompUpgradeFormProps) {
  const router = useRouter();
  const [tier, setTier] = useState<"pro" | "pro_plus">(
    user.tier === "pro_plus" ? "pro_plus" : "pro"
  );
  const [expiresAt, setExpiresAt] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isComp = user.billingSource === "comp";

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${user.id}/comp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", tier, expiresAt, reason }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not grant comp access.");
      setLoading(false);
      return;
    }

    setMessage("Comp upgrade applied.");
    router.refresh();
    setLoading(false);
  }

  async function handleRevoke(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${user.id}/comp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", reason: revokeReason }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not revoke comp access.");
      setLoading(false);
      return;
    }

    setMessage("Comp access revoked.");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
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

      <form
        onSubmit={handleGrant}
        className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4"
      >
        <h3 className="font-display text-sm font-semibold text-forge-text">
          Comp upgrade (no charge)
        </h3>
        <p className="mt-1 text-xs text-forge-muted">
          Grants Pro or Pro+ without Stripe billing. Requires a reason and expiry.
        </p>

        <div className="mt-4 grid gap-3">
          <label className="text-xs font-medium text-forge-muted">
            Tier
            <select
              value={tier}
              onChange={(e) =>
                setTier(e.target.value as "pro" | "pro_plus")
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
            >
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro+</option>
            </select>
          </label>

          <label className="text-xs font-medium text-forge-muted">
            Expires
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
            />
          </label>

          <label className="text-xs font-medium text-forge-muted">
            Reason (min 10 characters)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={10}
              rows={3}
              placeholder="Coach partnership, beta tester, support resolution…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-bold text-white hover:bg-forge-glow disabled:opacity-60"
        >
          {loading ? "Saving…" : "Apply comp upgrade"}
        </button>
      </form>

      {isComp ? (
        <form
          onSubmit={handleRevoke}
          className="rounded-2xl border border-forge-coral/20 bg-forge-coral/5 p-4"
        >
          <h3 className="font-display text-sm font-semibold text-forge-text">
            Revoke comp access
          </h3>
          {user.compReason ? (
            <p className="mt-1 text-xs text-forge-muted">
              Current reason: {user.compReason}
            </p>
          ) : null}
          <label className="mt-3 block text-xs font-medium text-forge-muted">
            Revoke reason
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              required
              minLength={10}
              rows={2}
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-xl border border-forge-coral/40 px-4 py-2.5 text-sm font-semibold text-forge-coral hover:bg-forge-coral/10 disabled:opacity-60"
          >
            Revoke comp
          </button>
        </form>
      ) : null}
    </div>
  );
}
