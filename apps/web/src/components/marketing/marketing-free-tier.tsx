import { freeTierIncludes } from "./marketing-data";
import { MarketingSection, MarketingSectionIntro } from "./marketing-section";

export function MarketingFreeTier() {
  return (
    <MarketingSection>
      <MarketingSectionIntro
        title="Start free. Train seriously."
        description="Core training, nutrition, and progress tools are included at no cost. Upgrade later for device sync, extended projections, and AI coaching."
      />

      <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
        {freeTierIncludes.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-forge-surface-raised px-4 py-4 text-sm text-forge-text sm:gap-4 sm:px-5 sm:py-4 sm:text-base"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-success/20 text-xs font-bold text-forge-success sm:h-7 sm:w-7 sm:text-sm">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </MarketingSection>
  );
}
