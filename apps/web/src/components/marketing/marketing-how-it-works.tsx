import { howItWorksSteps } from "./marketing-data";
import { MarketingSection, MarketingSectionIntro } from "./marketing-section";

export function MarketingHowItWorks() {
  return (
    <MarketingSection>
      <MarketingSectionIntro
        title="How it works"
        description="From first login to your first logged set — three steps to a plan you can actually follow."
      />

      <ol className="mt-6 space-y-4 sm:mt-8 sm:space-y-5 md:space-y-6">
        {howItWorksSteps.map((item) => (
          <li
            key={item.step}
            className="flex gap-4 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-5 sm:gap-5 sm:p-6 md:p-7"
          >
            <span className="font-display shrink-0 text-2xl font-bold text-forge-ember/80 sm:text-3xl">
              {item.step}
            </span>
            <div className="min-w-0 space-y-2 sm:space-y-2.5">
              <h3 className="font-display text-base font-semibold text-forge-text sm:text-lg">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-forge-muted sm:text-[0.9375rem]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </MarketingSection>
  );
}
