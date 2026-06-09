import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { MarketingSection, MarketingSectionIntro } from "./marketing-section";

export function MarketingCta() {
  return (
    <MarketingSection variant="card" className="border-forge-ember/30">
      <MarketingSectionIntro
        title="Ready to forge your best self?"
        description="Create a free account in under a minute. Answer a few questions, get your program, and start logging today."
      />

      <div className="mt-6 sm:mt-8">
        <MarketingCtaButtons signupLabel="Get Started — It's Free" />
      </div>
    </MarketingSection>
  );
}
