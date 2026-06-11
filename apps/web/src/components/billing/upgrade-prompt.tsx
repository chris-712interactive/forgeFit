import Link from "next/link";
import type { PaidTier } from "@/lib/billing/types";

interface UpgradePromptProps {
  title: string;
  description: string;
  /** Link to profile subscription section */
  href?: string;
  suggestedTier?: PaidTier;
  compact?: boolean;
}

export function UpgradePrompt({
  title,
  description,
  href = "/profile#subscription",
  suggestedTier = "pro",
  compact = false,
}: UpgradePromptProps) {
  const tierLabel = suggestedTier === "pro_plus" ? "Pro+" : "Pro";

  if (compact) {
    return (
      <p className="text-xs text-forge-muted">
        {description}{" "}
        <Link
          href={href}
          className="font-medium text-forge-ember underline-offset-2 hover:underline"
        >
          Upgrade to {tierLabel}
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-forge-gold/30 bg-forge-gold/5 p-4 sm:p-5">
      <p className="font-display text-sm font-semibold text-forge-text">
        {title}
      </p>
      <p className="mt-1 text-sm text-forge-muted">{description}</p>
      <Link
        href={href}
        className="mt-3 inline-flex rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
      >
        View {tierLabel} plans
      </Link>
    </div>
  );
}
