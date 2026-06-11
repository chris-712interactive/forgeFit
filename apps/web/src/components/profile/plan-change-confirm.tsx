"use client";

import { formatUsdFromCents } from "@/lib/billing/format-money";
import type { PlanChangePreview } from "@/lib/billing/plan-change-preview";
import { TIER_MARKETING } from "@/lib/billing/pricing";
import type { PaidTier } from "@/lib/billing/types";

interface PlanChangeConfirmProps {
  targetTier: PaidTier;
  preview: PlanChangePreview | null;
  loading: boolean;
  previewError: string | null;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlanChangeConfirm({
  targetTier,
  preview,
  loading,
  previewError,
  confirming,
  onConfirm,
  onCancel,
}: PlanChangeConfirmProps) {
  const targetName = TIER_MARKETING[targetTier].name;
  const isUpgrade = preview?.isUpgrade ?? targetTier === "pro_plus";

  return (
    <div className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 p-4">
      <p className="text-sm font-medium text-forge-text">
        {isUpgrade ? `Confirm upgrade to ${targetName}` : `Confirm switch to ${targetName}`}
      </p>

      {loading && (
        <p className="mt-2 text-xs text-forge-muted">
          Calculating your billing adjustment…
        </p>
      )}

      {previewError && (
        <p className="mt-2 text-xs text-forge-coral" role="alert">
          {previewError}
        </p>
      )}

      {preview && !loading && (
        <div className="mt-3 space-y-3 text-xs text-forge-text">
          <div className="rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2.5">
            <p className="text-forge-muted">Plan change</p>
            <p className="mt-1 font-medium">
              {preview.currentTier
                ? TIER_MARKETING[preview.currentTier].name
                : "Free"}{" "}
              ({preview.currentRecurringLabel}) → {targetName} (
              {preview.newRecurringLabel})
            </p>
          </div>

          {isUpgrade ? (
            <div className="rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2.5">
              <p className="text-forge-muted">Due today (prorated upgrade)</p>
              <p className="mt-1 text-base font-semibold text-forge-gold">
                {formatUsdFromCents(preview.dueTodayCents)}
              </p>
              <p className="mt-1 text-forge-muted">
                This is the price difference for the rest of your current
                billing period — not your next full renewal (
                {preview.newRecurringLabel} on{" "}
                {preview.periodEndLabel ?? "your renewal date"}).
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2.5">
              <p className="text-forge-muted">Billing adjustment</p>
              <p className="mt-1 font-medium">
                {preview.creditCents > 0
                  ? `You'll receive ${formatUsdFromCents(preview.creditCents)} credit on your next invoice for unused Pro+ time.`
                  : "You'll receive a prorated credit on your next invoice for unused Pro+ time."}{" "}
                Your plan renews at {preview.newRecurringLabel}
                {preview.periodEndLabel
                  ? ` on ${preview.periodEndLabel}`
                  : ""}
                .
              </p>
            </div>
          )}

          <div className="rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2.5">
            <p className="text-forge-muted">Ongoing price</p>
            <p className="mt-1 font-medium">{preview.newRecurringLabel}</p>
            {preview.periodEndLabel && isUpgrade && (
              <p className="mt-1 text-forge-muted">
                Your next full renewal is on {preview.periodEndLabel}.
              </p>
            )}
          </div>

          {preview.prorationLines.length > 0 && (
            <ul className="space-y-1 text-forge-muted">
              {preview.prorationLines.map((line) => (
                <li key={`${line.description}-${line.amountCents}`}>
                  · {line.description}{" "}
                  <span className="text-forge-text">
                    ({formatUsdFromCents(line.amountCents)})
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-forge-muted">
            {isUpgrade
              ? "Your card on file will be charged the prorated amount above. You won't be redirected to Stripe."
              : "Your subscription updates immediately. Unused Pro+ time is credited on your next invoice."}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={loading || confirming || Boolean(previewError) || !preview}
          onClick={onConfirm}
          className="min-h-[44px] flex-1 rounded-xl bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forge-glow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirming
            ? "Updating…"
            : isUpgrade
              ? `Confirm upgrade · ${preview ? formatUsdFromCents(preview.dueTodayCents) : ""}`
              : "Confirm switch to Pro"}
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={onCancel}
          className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
