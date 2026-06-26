import type { ReactNode } from "react";

/** Standard content width for text-heavy marketing sections */
export const marketingContentClass =
  "mx-auto w-full max-w-3xl px-5 sm:px-8 md:px-10 lg:px-12";

/** Wide layout for grids, hero, pricing, and footer */
export const marketingWideClass =
  "mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10";

interface MarketingSectionProps {
  children: ReactNode;
  className?: string;
  variant?: "plain" | "card" | "highlight";
  id?: string;
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
  id,
}: MarketingSectionProps) {
  return (
    <section id={id} className={`${variantClass[variant]} ${className}`.trim()}>
      {children}
    </section>
  );
}

interface MarketingSectionIntroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  eyebrowClassName?: string;
  align?: "left" | "center";
  titleAs?: "h2" | "h3";
  headingId?: string;
}

export function MarketingSectionIntro({
  eyebrow,
  title,
  description,
  eyebrowClassName = "text-forge-muted",
  align = "left",
  titleAs: TitleTag = "h2",
  headingId,
}: MarketingSectionIntroProps) {
  const isCenter = align === "center";
  const alignClass = isCenter ? "text-center" : "";

  return (
    <div className={`space-y-3 sm:space-y-4 ${alignClass}`}>
      {eyebrow ? (
        <p
          className={`font-display text-xs font-semibold uppercase tracking-wider sm:text-sm ${eyebrowClassName}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <TitleTag
        id={headingId}
        className={`font-display text-2xl font-bold leading-snug text-forge-text sm:text-3xl md:text-[2rem] ${
          isCenter ? "mx-auto max-w-2xl" : "max-w-prose"
        }`}
      >
        {title}
      </TitleTag>
      {description ? (
        <p
          className={`max-w-prose text-sm leading-relaxed text-forge-muted sm:text-base ${
            isCenter ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface MarketingPageSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  ariaLabelledBy?: string;
}

/** Full-width section wrapper with consistent vertical rhythm */
export function MarketingPageSection({
  children,
  id,
  className = "",
  ariaLabelledBy,
}: MarketingPageSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`${marketingWideClass} ${className}`.trim()}
    >
      {children}
    </section>
  );
}
