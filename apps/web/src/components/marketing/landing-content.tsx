import { MarketingCta } from "./marketing-cta";
import { MarketingDashboardPreview } from "./marketing-dashboard-preview";
import { MarketingEvidence } from "./marketing-evidence";
import { MarketingFaq } from "./marketing-faq";
import { MarketingFeatures } from "./marketing-features";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import { MarketingHero } from "./marketing-hero";
import { MarketingHowItWorks } from "./marketing-how-it-works";
import { MarketingPricing } from "./marketing-pricing";
import { MarketingSeoContent } from "./marketing-seo-content";
import { MarketingStatsBar } from "./marketing-stats-bar";
import { LandingJsonLd } from "./landing-json-ld";

export function LandingContent() {
  return (
    <>
      <LandingJsonLd />

      <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
        <MarketingHeader />

        <MarketingHero />

        <main className="flex flex-1 flex-col gap-16 pb-16 pt-8 sm:gap-20 sm:pb-20 sm:pt-10 md:gap-24 md:pb-24">
          <MarketingStatsBar />
          <MarketingFeatures />
          <MarketingDashboardPreview />
          <MarketingHowItWorks />
          <MarketingEvidence />
          <MarketingPricing />
          <MarketingFaq />
          <MarketingSeoContent />
          <MarketingCta />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
