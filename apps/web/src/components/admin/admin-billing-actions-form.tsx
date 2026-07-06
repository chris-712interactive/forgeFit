"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminBillingContext } from "@/lib/admin/billing-actions";

interface AdminBillingActionsFormProps {
  userId: string;
  context: AdminBillingContext;
}

export function AdminBillingActionsForm({
  userId,
  context,
}: AdminBillingActionsFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!context.canManageBilling) {
    return (
      <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          Billing actions
        </h3>
        <p className="mt-2 text-xs text-forge-muted">
          Requires an active Stripe subscription. Comp accounts use comp revoke
          instead.
        </p>
      </div>
    );
  }

  async function runAction(
    action: "cancel_period_end" | "cancel_immediate" | "refund_latest"
  ) {
    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }

    const labels = {
      cancel_period_end: "cancel at period end",
      cancel_immediate: "cancel immediately",
      refund_latest: "refund the latest payment",
    };

    if (
      !window.confirm(
        `Confirm ${labels[action]} for this user? This writes to Stripe and the audit log.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${userId}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    const body = (await response.json()) as { error?: string; refundId?: string };
    if (!response.ok) {
      setError(body.error ?? "Billing action failed.");
      setLoading(false);
      return;
    }

    setMessage(
      action === "refund_latest"
        ? `Refund issued (${body.refundId ?? "ok"}).`
        : "Billing action completed."
    );
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-forge-coral/20 bg-forge-coral/5 p-4">
      <h3 className="font-display text-sm font-semibold text-forge-text">
        Billing actions
      </h3>
      <p className="mt-1 text-xs text-forge-muted">
        Stripe subscription {context.stripeSubscriptionId}
      </p>

      {message ? (
        <p className="mt-3 rounded-xl border border-forge-success/30 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <label className="mt-4 block text-xs font-medium text-forge-muted">
        Reason (min 10 characters)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={10}
          rows={2}
          className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
        />
      </label>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => runAction("cancel_period_end")}
          className="rounded-xl border border-white/10 bg-forge-surface px-4 py-2.5 text-sm font-semibold text-forge-text hover:bg-white/5 disabled:opacity-60"
        >
          Cancel at period end
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => runAction("cancel_immediate")}
          className="rounded-xl border border-forge-coral/40 px-4 py-2.5 text-sm font-semibold text-forge-coral hover:bg-forge-coral/10 disabled:opacity-60"
        >
          Cancel immediately
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => runAction("refund_latest")}
          className="rounded-xl border border-forge-gold/40 px-4 py-2.5 text-sm font-semibold text-forge-gold hover:bg-forge-gold/10 disabled:opacity-60"
        >
          Refund latest payment
        </button>
      </div>
    </div>
  );
}
