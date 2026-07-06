"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminUserDiscountContext } from "@/lib/admin/discount";
import { formatCouponOptionLabel } from "@/lib/admin/stripe-discount";

interface AdminDiscountFormProps {
  userId: string;
  context: AdminUserDiscountContext;
}

function formatCurrentDiscount(
  discount: AdminUserDiscountContext["currentDiscount"]
): string {
  if (!discount) return "None";

  const parts = [discount.couponName ?? discount.couponId];
  if (discount.percentOff) {
    parts.push(`${discount.percentOff}% off`);
  } else if (discount.amountOff) {
    parts.push(`$${(discount.amountOff / 100).toFixed(2)} off`);
  }
  if (discount.end) {
    parts.push(`until ${new Date(discount.end).toLocaleDateString()}`);
  }
  return parts.join(" · ");
}

export function AdminDiscountForm({ userId, context }: AdminDiscountFormProps) {
  const router = useRouter();
  const [couponId, setCouponId] = useState(context.coupons[0]?.id ?? "");
  const [customCouponId, setCustomCouponId] = useState("");
  const [reason, setReason] = useState("");
  const [removeReason, setRemoveReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!context.canManageDiscount) {
    return (
      <div className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4">
        <h3 className="font-display text-sm font-semibold text-forge-text">
          Stripe discount
        </h3>
        <p className="mt-2 text-xs text-forge-muted">
          Requires an active Stripe subscription. Comp accounts use comp grants
          instead of coupons.
        </p>
      </div>
    );
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const selectedCouponId = customCouponId.trim() || couponId;

    const response = await fetch(`/api/admin/users/${userId}/discount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponId: selectedCouponId, reason }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not apply discount.");
      setLoading(false);
      return;
    }

    setMessage("Discount applied to Stripe subscription.");
    router.refresh();
    setLoading(false);
  }

  async function handleRemove(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${userId}/discount`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: removeReason }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not remove discount.");
      setLoading(false);
      return;
    }

    setMessage("Discount removed.");
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
        onSubmit={handleApply}
        className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4"
      >
        <h3 className="font-display text-sm font-semibold text-forge-text">
          Stripe discount
        </h3>
        <p className="mt-1 text-xs text-forge-muted">
          Attach a coupon to this user&apos;s Stripe subscription. Freemium users
          upgrade to paid first — no trial extension needed.
        </p>

        <p className="mt-3 text-xs text-forge-muted">
          Current discount:{" "}
          <span className="font-medium text-forge-text">
            {formatCurrentDiscount(context.currentDiscount)}
          </span>
        </p>

        <div className="mt-4 grid gap-3">
          {context.coupons.length > 0 ? (
            <label className="text-xs font-medium text-forge-muted">
              Coupon
              <select
                value={couponId}
                onChange={(e) => setCouponId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
              >
                {context.coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {formatCouponOptionLabel(coupon)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="text-xs font-medium text-forge-muted">
            Or coupon ID
            <input
              type="text"
              value={customCouponId}
              onChange={(e) => setCustomCouponId(e.target.value)}
              placeholder="coupon_… or COACH50"
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
              rows={2}
              placeholder="Coach partnership discount, retention offer…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-forge-steel px-4 py-2.5 text-sm font-bold text-forge-surface hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Attach to subscription"}
        </button>
      </form>

      {context.currentDiscount ? (
        <form
          onSubmit={handleRemove}
          className="rounded-2xl border border-forge-coral/20 bg-forge-coral/5 p-4"
        >
          <h3 className="font-display text-sm font-semibold text-forge-text">
            Remove discount
          </h3>
          <label className="mt-3 block text-xs font-medium text-forge-muted">
            Reason
            <textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
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
            Remove discount
          </button>
        </form>
      ) : null}
    </div>
  );
}
