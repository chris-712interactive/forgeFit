import Link from "next/link";

export type MarketingCtaVariant = "hero" | "default";

interface MarketingCtaButtonsProps {
  variant?: MarketingCtaVariant;
  signupLabel?: string;
  layout?: "stack" | "row";
}

export function MarketingCtaButtons({
  variant = "default",
  signupLabel = "Get Started — It's Free",
  layout = "stack",
}: MarketingCtaButtonsProps) {
  const isHero = variant === "hero";

  const signupClass = isHero
    ? "flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-white px-6 font-display text-base font-bold text-forge-ember transition-colors hover:bg-white/90 active:scale-[0.98] sm:min-h-[56px] sm:text-lg"
    : "flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-forge-ember px-6 font-display text-base font-bold text-white transition-colors hover:bg-forge-glow active:scale-[0.98] sm:min-h-[56px]";

  const signInClass = isHero
    ? "flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/40 px-6 font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10 sm:min-h-[52px]"
    : "flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[var(--border)] px-6 font-medium text-forge-text transition-colors hover:border-forge-muted sm:min-h-[52px]";

  const layoutClass =
    layout === "row"
      ? "flex flex-col gap-3 sm:flex-row sm:gap-4"
      : "flex flex-col gap-3 sm:gap-4";

  return (
    <div className={layoutClass}>
      <Link href="/signup" className={signupClass}>
        {signupLabel}
      </Link>
      <Link href="/login" className={signInClass}>
        Sign In
      </Link>
    </div>
  );
}
