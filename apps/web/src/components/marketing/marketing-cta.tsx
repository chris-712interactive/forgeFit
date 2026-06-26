import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { MarketingPageSection, MarketingSectionIntro } from "./marketing-section";

export function MarketingCta() {
  return (
    <MarketingPageSection ariaLabelledBy="final-cta-heading">
      <div className="relative overflow-hidden rounded-2xl border border-forge-ember/30 bg-gradient-to-br from-forge-ember/15 via-forge-surface-raised to-forge-surface p-8 sm:p-10 md:p-12">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-forge-ember/20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <MarketingSectionIntro
            headingId="final-cta-heading"
            title="Ready to forge your best self?"
            description="Create a free account in under a minute. Answer a few questions, get your personalized program, and start logging today — no credit card required."
            align="center"
          />

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-md">
              <MarketingCtaButtons signupLabel="Get Started — It's Free" />
            </div>
          </div>
        </div>
      </div>
    </MarketingPageSection>
  );
}
