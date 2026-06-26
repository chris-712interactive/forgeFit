import { howItWorksSteps } from "./marketing-data";
import {
  MarketingPageSection,
  MarketingSectionIntro,
} from "./marketing-section";

export function MarketingHowItWorks() {
  return (
    <MarketingPageSection
      id="how-it-works"
      ariaLabelledBy="how-it-works-heading"
    >
      <MarketingSectionIntro
        headingId="how-it-works-heading"
        eyebrow="Three steps"
        eyebrowClassName="text-forge-coral"
        title="From signup to your first logged set"
        description="No complicated setup. Answer a few questions, get your plan, and start training today."
        align="center"
      />

      <ol className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-3 lg:gap-6">
        {howItWorksSteps.map((item, index) => (
          <li
            key={item.step}
            className="relative rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-6 sm:p-7"
          >
            {index < howItWorksSteps.length - 1 ? (
              <span
                className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-forge-ember/40 lg:block"
                aria-hidden
              />
            ) : null}
            <span className="font-display inline-flex h-10 w-10 items-center justify-center rounded-xl bg-forge-ember/15 text-lg font-bold text-forge-ember">
              {item.step}
            </span>
            <h3 className="font-display mt-4 text-base font-semibold text-forge-text sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-forge-muted sm:text-[0.9375rem]">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </MarketingPageSection>
  );
}
