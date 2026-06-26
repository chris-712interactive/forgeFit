import Link from "next/link";
import { pricingTiers } from "./marketing-data";
import { IconCheck } from "./marketing-icons";
import {
  MarketingPageSection,
  MarketingSectionIntro,
} from "./marketing-section";

export function MarketingPricing() {
  return (
    <MarketingPageSection id="pricing" ariaLabelledBy="pricing-heading">
      <MarketingSectionIntro
        headingId="pricing-heading"
        eyebrow="Simple pricing"
        eyebrowClassName="text-forge-gold"
        title="Start free. Upgrade when you're ready."
        description="Every tier begins with a free account — no credit card required. Pick the plan that matches how deep you want to go."
        align="center"
      />

      <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-3 lg:gap-6">
        {pricingTiers.map((tier) => (
          <article
            key={tier.id}
            className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${
              tier.featured
                ? "border-forge-ember/50 bg-gradient-to-b from-forge-ember/10 to-forge-surface-raised shadow-lg shadow-forge-ember/10"
                : "border-[var(--border)] bg-forge-surface-raised"
            }`}
          >
            {tier.featured ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-forge-ember px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
                Most popular
              </span>
            ) : null}

            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-forge-text">
                {tier.name}
              </h3>
              <p className="font-display text-3xl font-extrabold text-forge-ember">
                {tier.price}
              </p>
              <p className="text-xs text-forge-muted">{tier.period}</p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-forge-muted">
              {tier.tagline}
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-forge-text"
                >
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-forge-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={`mt-8 flex min-h-[52px] items-center justify-center rounded-xl px-5 text-center font-display text-sm font-bold transition-colors active:scale-[0.98] sm:text-base ${
                tier.featured
                  ? "bg-forge-ember text-white hover:bg-forge-glow"
                  : "border border-[var(--border)] bg-forge-surface text-forge-text hover:border-forge-ember/40 hover:bg-forge-surface-raised"
              }`}
            >
              {tier.cta}
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-forge-muted sm:text-sm">
        All plans include personalized programs, offline logging, and nutrition
        tracking. Cancel paid tiers anytime from your profile.
      </p>
    </MarketingPageSection>
  );
}
