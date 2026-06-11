import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import type { PaidTier } from "@/lib/billing/types";
import type { ReactNode } from "react";

interface ProFeatureSectionProps {
  title: string;
  description?: string;
  unlocked: boolean;
  suggestedTier?: PaidTier;
  children: ReactNode;
}

export function ProFeatureSection({
  title,
  description,
  unlocked,
  suggestedTier = "pro",
  children,
}: ProFeatureSectionProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs text-forge-muted">{description}</p>
      )}

      <div className="mt-4">
        {unlocked ? (
          children
        ) : (
          <UpgradePrompt
            title={`Unlock ${title.toLowerCase()}`}
            description={
              description ??
              "Upgrade to Pro for long-horizon analytics on your training and nutrition."
            }
            suggestedTier={suggestedTier}
          />
        )}
      </div>
    </section>
  );
}
