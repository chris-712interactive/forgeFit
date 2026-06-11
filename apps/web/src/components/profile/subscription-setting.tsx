"use client";

import {
  PRO_PLUS_PRICING,
  PRO_PRICING,
  TIER_MARKETING,
  type BillingInterval,
} from "@/lib/billing/pricing";
import { hasProAccess, hasProPlusAccess } from "@/lib/billing/types";
import type { PaidTier, SubscriptionSnapshot } from "@/lib/billing/types";
import { useState } from "react";

interface SubscriptionSettingProps {
  subscription: SubscriptionSnapshot;
  stripeConfigured: boolean;
  checkoutStatus?: "success" | "canceled" | null;
}

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tierBadge(snapshot: SubscriptionSnapshot): string {
  if (hasProPlusAccess(snapshot)) return "Pro+";
  if (hasProAccess(snapshot)) return "Pro";
  return "Free";
}

export function SubscriptionSetting({
  subscription,
  stripeConfigured,
  checkoutStatus,
}: SubscriptionSettingProps) {
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [loadingTier, setLoadingTier] = useState<PaidTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPaid = hasProAccess(subscription);
  const periodEnd = formatPeriodEnd(subscription.currentPeriodEnd);

  async function startCheckout(tier: PaidTier) {
    if (!stripeConfigured || loadingTier) return;

    setLoadingTier(tier);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });

      const body = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !body.url) {
        setError(body.error ?? "Could not start checkout. Try again.");
        setLoadingTier(null);
        return;
      }

      window.location.href = body.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setLoadingTier(null);
    }
  }

  return (
    <section
      id="subscription"
      className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5"
    >
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Subscription
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Long-horizon analytics with Pro. Device sync, restaurant search, and AI
        coaching with Pro+.
      </p>

      {checkoutStatus === "success" && (
        <p className="mt-3 rounded-xl border border-forge-success/40 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          Payment received — your plan should update in a moment.
        </p>
      )}

      {checkoutStatus === "canceled" && (
        <p className="mt-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-forge-muted">
          Checkout canceled. No charge was made.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-forge-muted">
            Current plan
          </p>
          <p className="font-display text-lg font-semibold text-forge-gold">
            {tierBadge(subscription)}
          </p>
        </div>
        {isPaid && periodEnd && (
          <p className="text-xs text-forge-muted">
            Renews {periodEnd}
            {subscription.status === "trialing" ? " (trial)" : ""}
          </p>
        )}
      </div>

      {!isPaid && (
        <>
          <div className="mt-4 inline-flex rounded-xl border border-[var(--border)] p-1">
            {(["annual", "monthly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setInterval(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  interval === value
                    ? "bg-forge-ember text-white"
                    : "text-forge-muted hover:text-forge-text"
                }`}
              >
                {value}
                {value === "annual" ? " · best value" : ""}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["pro", "pro_plus"] as const).map((tier) => {
              const marketing = TIER_MARKETING[tier];
              const pricing = tier === "pro_plus" ? PRO_PLUS_PRICING : PRO_PRICING;
              const price =
                interval === "annual" ? pricing.annual : pricing.monthly;

              return (
                <div
                  key={tier}
                  className={`flex flex-col rounded-xl border p-4 ${
                    tier === "pro_plus"
                      ? "border-forge-gold/40 bg-forge-gold/5"
                      : "border-[var(--border)] bg-forge-surface"
                  }`}
                >
                  <p className="font-display font-semibold text-forge-text">
                    {marketing.name}
                  </p>
                  <p className="mt-1 text-lg font-bold text-forge-gold">
                    {price.label}
                  </p>
                  {interval === "annual" && (
                    <p className="text-xs text-forge-muted">
                      ~$
                      {pricing.annual.monthlyEquivalent.toFixed(2)}
                      /mo · save {pricing.annual.savingsPercent}%
                    </p>
                  )}
                  <p className="mt-2 text-xs text-forge-muted">
                    {marketing.tagline}
                  </p>
                  <ul className="mt-3 flex-1 space-y-1.5 text-xs text-forge-text">
                    {marketing.highlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-forge-success">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={!stripeConfigured || loadingTier !== null}
                    onClick={() => startCheckout(tier)}
                    className="mt-4 w-full rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forge-glow disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingTier === tier
                      ? "Redirecting…"
                      : `Upgrade to ${marketing.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {isPaid && !hasProPlusAccess(subscription) && (
        <div className="mt-4 rounded-xl border border-forge-gold/30 bg-forge-gold/5 p-4">
          <p className="text-sm font-medium text-forge-text">
            Want device sync, restaurant search, or AI coaching?
          </p>
          <p className="mt-1 text-xs text-forge-muted">
            Upgrade to Pro+ for integrations and Phase 8 features.
          </p>
          <button
            type="button"
            disabled={!stripeConfigured || loadingTier !== null}
            onClick={() => startCheckout("pro_plus")}
            className="mt-3 rounded-xl border border-forge-gold/50 px-4 py-2 text-sm font-semibold text-forge-gold transition-colors hover:bg-forge-gold/10 disabled:opacity-50"
          >
            {loadingTier === "pro_plus" ? "Redirecting…" : "Upgrade to Pro+"}
          </button>
        </div>
      )}

      {!stripeConfigured && (
        <p className="mt-3 text-xs text-forge-muted">
          Billing is not configured yet. Add Stripe keys to enable checkout.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
