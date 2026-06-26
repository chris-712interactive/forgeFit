import type { ComponentType } from "react";
import type { FeatureIconKey } from "./marketing-data";
import { featureHighlights } from "./marketing-data";
import {
  IconChart,
  IconDumbbell,
  IconFlame,
  IconLibrary,
  IconNutrition,
  IconOffline,
} from "./marketing-icons";
import {
  MarketingPageSection,
  MarketingSectionIntro,
} from "./marketing-section";

const iconMap = {
  dumbbell: IconDumbbell,
  chart: IconChart,
  nutrition: IconNutrition,
  offline: IconOffline,
  library: IconLibrary,
  flame: IconFlame,
} satisfies Record<FeatureIconKey, ComponentType<{ className?: string }>>;

export function MarketingFeatures() {
  return (
    <MarketingPageSection id="features" ariaLabelledBy="features-heading">
      <MarketingSectionIntro
        headingId="features-heading"
        eyebrow="Why ForgeRep"
        eyebrowClassName="text-forge-ember"
        title="Everything you need to train with intention"
        description="Programs, logging, nutrition, and progress — connected in one mobile-first experience so you always know where you stand."
        align="center"
      />

      <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {featureHighlights.map((feature) => {
          const Icon = iconMap[feature.icon];
          const isWide = feature.span === "wide";

          return (
            <article
              key={feature.title}
              className={`group rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 transition-colors hover:border-forge-ember/30 sm:p-6 ${isWide ? "sm:col-span-2 lg:col-span-3 lg:flex lg:items-start lg:gap-8" : ""}`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-forge-surface ${feature.accent} ${isWide ? "lg:h-14 lg:w-14" : ""}`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className={`mt-4 space-y-2 sm:space-y-2.5 ${isWide ? "lg:mt-0" : ""}`}>
                <h3 className="font-display text-base font-semibold text-forge-text sm:text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-forge-muted sm:text-[0.9375rem]">
                  {feature.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </MarketingPageSection>
  );
}
