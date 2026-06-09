import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { MarketingSection } from "./marketing-section";

interface MarketingCtaBannerProps {
  title: string;
  description?: string;
  signupLabel?: string;
  layout?: "stack" | "row";
}

export function MarketingCtaBanner({
  title,
  description,
  signupLabel,
  layout = "stack",
}: MarketingCtaBannerProps) {
  return (
    <MarketingSection
      variant="card"
      className="border-forge-ember/25 bg-gradient-to-br from-forge-surface-raised to-forge-surface"
    >
      <div className="space-y-3 sm:space-y-4">
        <h2 className="font-display text-lg font-bold leading-snug text-forge-text sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-prose text-sm leading-relaxed text-forge-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-5 sm:mt-6">
        <MarketingCtaButtons signupLabel={signupLabel} layout={layout} />
      </div>
    </MarketingSection>
  );
}
