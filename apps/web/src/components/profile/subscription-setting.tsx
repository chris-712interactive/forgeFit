"use client";

import {
  PRO_PLUS_PRICING,
  PRO_PRICING,
  TIER_MARKETING,
  type BillingInterval,
} from "@/lib/billing/pricing";
import type { PlanChangePreview } from "@/lib/billing/plan-change-preview";
import { hasProAccess, hasProPlusAccess } from "@/lib/billing/types";
import type { PaidTier, SubscriptionSnapshot } from "@/lib/billing/types";
import { PlanChangeConfirm } from "@/components/profile/plan-change-confirm";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionSettingProps {
  subscription: SubscriptionSnapshot;
  stripeConfigured: boolean;
  checkoutStatus?: "success" | "canceled" | null;
}

type ManageAction =
  | "checkout"
  | "change"
  | "portal"
  | "downgrade"
  | "cancel"
  | "resume"
  | null;

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
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [action, setAction] = useState<ManageAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [syncingCheckout, setSyncingCheckout] = useState(
    checkoutStatus === "success"
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<PaidTier | null>(
    null
  );
  const [planChangePreview, setPlanChangePreview] =
    useState<PlanChangePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutStatus !== "success") return;

    let cancelled = false;

    async function syncAfterCheckout(attempt: number) {
      setSyncingCheckout(true);
      setError(null);

      try {
        const response = await fetch("/api/stripe/sync", { method: "POST" });
        const body = (await response.json()) as {
          synced?: boolean;
          error?: string;
        };

        if (cancelled) return;

        if (response.ok && body.synced) {
          setSyncingCheckout(false);
          router.refresh();
          return;
        }

        if (attempt < 5) {
          window.setTimeout(() => void syncAfterCheckout(attempt + 1), 1500);
          return;
        }

        setSyncingCheckout(false);
        setError(
          body.error ??
            "Payment succeeded but your plan has not synced yet. Refresh in a moment or contact support."
        );
      } catch {
        if (cancelled) return;
        if (attempt < 5) {
          window.setTimeout(() => void syncAfterCheckout(attempt + 1), 1500);
          return;
        }
        setSyncingCheckout(false);
        setError("Could not confirm your subscription. Try refreshing the page.");
      }
    }

    void syncAfterCheckout(0);

    return () => {
      cancelled = true;
    };
  }, [checkoutStatus, router]);

  const isPaid = hasProAccess(subscription);
  const isProPlus = hasProPlusAccess(subscription);
  const periodEnd = formatPeriodEnd(subscription.currentPeriodEnd);

  async function startCheckout(tier: PaidTier) {
    if (!stripeConfigured || action) return;

    setAction("checkout");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });

      const body = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !body.url) {
        setError(body.error ?? "Could not start checkout. Try again.");
        setAction(null);
        return;
      }

      window.location.href = body.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setAction(null);
    }
  }

  async function requestPlanChangePreview(tier: PaidTier) {
    if (!stripeConfigured || action) return;

    setPendingPlanChange(tier);
    setPlanChangePreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/subscription/preview-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const body = (await response.json()) as PlanChangePreview & {
        error?: string;
      };

      if (!response.ok) {
        setPreviewError(body.error ?? "Could not load billing preview.");
        return;
      }

      setPlanChangePreview(body);
    } catch {
      setPreviewError("Could not load billing preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function cancelPlanChangePreview() {
    setPendingPlanChange(null);
    setPlanChangePreview(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }

  async function confirmPlanChange() {
    if (!pendingPlanChange) return;

    const success = await changePlan(
      pendingPlanChange,
      undefined,
      planChangePreview?.prorationDate
    );
    if (success) {
      cancelPlanChangePreview();
    }
  }

  async function changePlan(
    tier: PaidTier,
    billingInterval?: BillingInterval,
    prorationDate?: number
  ): Promise<boolean> {
    if (!stripeConfigured || action) return false;

    setAction("change");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          interval: billingInterval ?? interval,
          prorationDate,
        }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not update your plan.");
        setAction(null);
        return false;
      }

      setMessage(
        tier === "pro_plus"
          ? "Upgraded to Pro+. Changes may take a moment to appear."
          : "Plan updated to Pro. Changes may take a moment to appear."
      );
      setAction(null);
      router.refresh();
      return true;
    } catch {
      setError("Could not update your plan.");
      setAction(null);
      return false;
    }
  }

  async function openPortal() {
    if (!stripeConfigured || action) return;

    setAction("portal");
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const body = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !body.url) {
        setError(body.error ?? "Could not open billing portal.");
        setAction(null);
        return;
      }

      window.location.href = body.url;
    } catch {
      setError("Could not open billing portal.");
      setAction(null);
    }
  }

  async function cancelPlan(immediate: boolean) {
    if (!stripeConfigured || action) return;

    setAction("cancel");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediate }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not cancel subscription.");
        setAction(null);
        return;
      }

      setShowCancelConfirm(false);
      setMessage(
        immediate
          ? "Subscription canceled. You are back on the free plan."
          : periodEnd
            ? `Subscription will end on ${periodEnd}. Pro access continues until then.`
            : "Subscription set to cancel at the end of your billing period."
      );
      setAction(null);
      router.refresh();
    } catch {
      setError("Could not cancel subscription.");
      setAction(null);
    }
  }

  async function resumePlan() {
    if (!stripeConfigured || action) return;

    setAction("resume");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/stripe/subscription/resume", {
        method: "POST",
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not resume subscription.");
        setAction(null);
        return;
      }

      setMessage("Subscription renewed — your plan will continue.");
      setAction(null);
      router.refresh();
    } catch {
      setError("Could not resume subscription.");
      setAction(null);
    }
  }

  function handleUpgrade(tier: PaidTier) {
    if (isPaid) {
      void requestPlanChangePreview(tier);
    } else {
      void startCheckout(tier);
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
          {syncingCheckout
            ? "Payment received — activating your plan…"
            : "Payment received — your plan should update in a moment."}
        </p>
      )}

      {checkoutStatus === "canceled" && (
        <p className="mt-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-forge-muted">
          Checkout canceled. No charge was made.
        </p>
      )}

      {message && (
        <p className="mt-3 rounded-xl border border-forge-success/40 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
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
            {subscription.cancelAtPeriodEnd
              ? `Access until ${periodEnd}`
              : `Renews ${periodEnd}`}
            {subscription.status === "trialing" ? " (trial)" : ""}
          </p>
        )}
      </div>

      {isPaid && subscription.cancelAtPeriodEnd && (
        <div className="mt-3 rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-4 py-3">
          <p className="text-sm text-forge-text">
            Your subscription is scheduled to end
            {periodEnd ? ` on ${periodEnd}` : " at the end of this period"}.
            You keep Pro access until then.
          </p>
          <button
            type="button"
            disabled={!stripeConfigured || action !== null}
            onClick={() => void resumePlan()}
            className="mt-3 rounded-xl bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forge-glow disabled:opacity-50"
          >
            {action === "resume" ? "Resuming…" : "Keep my subscription"}
          </button>
        </div>
      )}

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
                    disabled={!stripeConfigured || action !== null}
                    onClick={() => handleUpgrade(tier)}
                    className="mt-4 w-full rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forge-glow disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {action === "checkout"
                      ? "Redirecting…"
                      : `Upgrade to ${marketing.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {isPaid && !subscription.cancelAtPeriodEnd && (
        <div className="mt-4 space-y-3">
          {!isProPlus && (
            pendingPlanChange === "pro_plus" ? (
              <PlanChangeConfirm
                targetTier="pro_plus"
                preview={planChangePreview}
                loading={previewLoading}
                previewError={previewError}
                confirming={action === "change"}
                onConfirm={() => void confirmPlanChange()}
                onCancel={cancelPlanChangePreview}
              />
            ) : (
              <div className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 p-4">
                <p className="text-sm font-medium text-forge-text">
                  Upgrade to Pro+
                </p>
                <p className="mt-1 text-xs text-forge-muted">
                  Device sync, restaurant search, and AI coaching. You&apos;ll
                  see the prorated charge before confirming.
                </p>
                <button
                  type="button"
                  disabled={!stripeConfigured || action !== null}
                  onClick={() => void requestPlanChangePreview("pro_plus")}
                  className="mt-3 rounded-xl border border-forge-gold/50 px-4 py-2 text-sm font-semibold text-forge-gold transition-colors hover:bg-forge-gold/10 disabled:opacity-50"
                >
                  Review upgrade pricing
                </button>
              </div>
            )
          )}

          {isProPlus && (
            pendingPlanChange === "pro" ? (
              <PlanChangeConfirm
                targetTier="pro"
                preview={planChangePreview}
                loading={previewLoading}
                previewError={previewError}
                confirming={action === "change"}
                onConfirm={() => void confirmPlanChange()}
                onCancel={cancelPlanChangePreview}
              />
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
                <p className="text-sm font-medium text-forge-text">
                  Downgrade to Pro
                </p>
                <p className="mt-1 text-xs text-forge-muted">
                  Keep analytics and projections; lose integrations and AI
                  coaching. You&apos;ll see billing adjustments before
                  confirming.
                </p>
                <button
                  type="button"
                  disabled={!stripeConfigured || action !== null}
                  onClick={() => void requestPlanChangePreview("pro")}
                  className="mt-3 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40 disabled:opacity-50"
                >
                  Review downgrade pricing
                </button>
              </div>
            )
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!stripeConfigured || action !== null}
              onClick={() => void openPortal()}
              className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40 disabled:opacity-50"
            >
              {action === "portal" ? "Opening…" : "Manage billing"}
            </button>
          </div>

          {!showCancelConfirm ? (
            <button
              type="button"
              disabled={!stripeConfigured || action !== null}
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm font-medium text-forge-coral transition-colors hover:underline disabled:opacity-50"
            >
              Cancel subscription and return to Free
            </button>
          ) : (
            <div className="rounded-xl border border-forge-coral/30 bg-forge-coral/5 p-4">
              <p className="text-sm font-medium text-forge-text">
                Cancel your subscription?
              </p>
              <p className="mt-1 text-xs text-forge-muted">
                By default you keep access until{" "}
                {periodEnd ?? "the end of your billing period"}, then return to
                Free. You can resume anytime before then.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={action !== null}
                  onClick={() => void cancelPlan(false)}
                  className="min-h-[44px] flex-1 rounded-xl bg-forge-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {action === "cancel"
                    ? "Canceling…"
                    : "Cancel at period end"}
                </button>
                <button
                  type="button"
                  disabled={action !== null}
                  onClick={() => setShowCancelConfirm(false)}
                  className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
                >
                  Keep subscription
                </button>
              </div>
            </div>
          )}
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
