import { trustStats } from "./marketing-data";
import { MarketingPageSection } from "./marketing-section";

export function MarketingStatsBar() {
  return (
    <MarketingPageSection
      ariaLabelledBy="trust-stats-heading"
      className="-mt-6 sm:-mt-8"
    >
      <h2 id="trust-stats-heading" className="sr-only">
        ForgeRep at a glance
      </h2>
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
        {trustStats.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="font-display text-2xl font-bold text-forge-ember sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-forge-muted sm:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </MarketingPageSection>
  );
}
