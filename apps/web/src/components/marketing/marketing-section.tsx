import type { ReactNode } from "react";

/** Shared horizontal padding + max width for all marketing sections */
export const marketingContentClass =
  "mx-auto w-full max-w-3xl px-5 sm:px-8 md:px-10 lg:px-12";

interface MarketingSectionProps {
  children: ReactNode;
  className?: string;
  variant?: "plain" | "card" | "highlight";
}

const variantClass: Record<NonNullable<MarketingSectionProps["variant"]>, string> =
  {
    plain: "",
    card: "rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-6 sm:p-7 md:p-8",
    highlight:
      "rounded-2xl border border-forge-gold/25 bg-forge-surface-raised p-6 sm:p-7 md:p-8",
  };

export function MarketingSection({
  children,
  className = "",
  variant = "plain",
}: MarketingSectionProps) {
  return (
    <section className={`${variantClass[variant]} ${className}`.trim()}>
      {children}
    </section>
  );
}

interface MarketingSectionIntroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  eyebrowClassName?: string;
}

export function MarketingSectionIntro({
  eyebrow,
  title,
  description,
  eyebrowClassName = "text-forge-muted",
}: MarketingSectionIntroProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {eyebrow ? (
        <p
          className={`font-display text-xs font-semibold uppercase tracking-wider sm:text-sm ${eyebrowClassName}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-xl font-bold leading-snug text-forge-text sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-prose text-sm leading-relaxed text-forge-muted sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
