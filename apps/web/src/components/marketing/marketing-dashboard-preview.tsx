import { MarketingAppPreview } from "./marketing-app-preview";
import { MarketingCtaButtons } from "./marketing-cta-buttons";
import {
  MarketingPageSection,
  MarketingSectionIntro,
} from "./marketing-section";

export function MarketingDashboardPreview() {
  return (
    <MarketingPageSection ariaLabelledBy="dashboard-preview-heading">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <MarketingSectionIntro
            headingId="dashboard-preview-heading"
            eyebrow="Accountability at a glance"
            eyebrowClassName="text-forge-gold"
            title="Open the app. Know exactly where you stand."
            description="Your Home dashboard surfaces today's macros, this week's workouts, and the body of work you've already logged — before you dive into the full plan."
          />

          <div className="mt-8 hidden sm:block">
            <MarketingCtaButtons
              signupLabel="Start Tracking Free"
              layout="row"
            />
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <MarketingAppPreview variant="inline" />
        </div>
      </div>
    </MarketingPageSection>
  );
}
