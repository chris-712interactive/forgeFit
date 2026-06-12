import { featureHighlights } from "./marketing-data";
import { MarketingSection, MarketingSectionIntro } from "./marketing-section";

export function MarketingFeatures() {
  return (
    <MarketingSection>
      <MarketingSectionIntro
        title="Everything you need to train with intention"
        description="ForgeRep connects your program, logging, nutrition, and progress into one mobile-first experience — so you always know where you stand."
      />

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 md:gap-6">
        {featureHighlights.map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-5 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 h-10 w-1 shrink-0 rounded-full sm:h-12 ${feature.accent}`}
              />
              <div className="min-w-0 space-y-2 sm:space-y-2.5">
                <h3 className="font-display text-base font-semibold text-forge-text sm:text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-forge-muted sm:text-[0.9375rem]">
                  {feature.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </MarketingSection>
  );
}
