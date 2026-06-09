import { MarketingCta } from "./marketing-cta";
import { MarketingCtaBanner } from "./marketing-cta-banner";
import { MarketingDashboardPreview } from "./marketing-dashboard-preview";
import { MarketingEvidence } from "./marketing-evidence";
import { MarketingFeatures } from "./marketing-features";
import { MarketingFreeTier } from "./marketing-free-tier";
import { MarketingHero } from "./marketing-hero";
import { MarketingHowItWorks } from "./marketing-how-it-works";
import { LandingJsonLd } from "./landing-json-ld";
import { marketingContentClass } from "./marketing-section";
import Link from "next/link";

export function LandingContent() {
  return (
    <>
      <LandingJsonLd />

      <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
        <MarketingHero />

        <main
          className={`${marketingContentClass} flex flex-1 flex-col gap-12 pb-10 pt-10 sm:gap-14 sm:pb-12 sm:pt-12 md:gap-16 md:pb-14 md:pt-14 lg:gap-20 lg:pb-16 lg:pt-16`}
        >
          <MarketingFeatures />

          <MarketingCtaBanner
            title="Your program is one signup away"
            description="Tell us your goals and equipment — get a personalized plan in minutes. No credit card required."
            signupLabel="Create Free Account"
            layout="row"
          />

          <MarketingDashboardPreview />

          <MarketingCtaBanner
            title="See your progress the moment you log in"
            description="Macro targets, weekly workouts, and logged volume — accountability built into your home screen."
            signupLabel="Start Tracking Free"
          />

          <MarketingHowItWorks />

          <MarketingEvidence />

          <MarketingFreeTier />

          <MarketingCta />
        </main>

        <footer
          className={`${marketingContentClass} border-t border-[var(--border)] py-8 sm:py-10`}
        >
          <p className="text-center text-xs leading-relaxed text-forge-muted sm:text-sm">
            Evidence-based fitness & nutrition · Mobile-first · Works offline
          </p>
          <nav
            className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
            aria-label="Marketing footer"
          >
            <Link
              href="/signup"
              className="font-semibold text-forge-ember hover:text-forge-glow"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="font-medium text-forge-muted hover:text-forge-text"
            >
              Sign In
            </Link>
          </nav>
        </footer>
      </div>
    </>
  );
}
