import { MarketingAppPreview } from "./marketing-app-preview";
import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { heroPills } from "./marketing-data";
import { marketingWideClass } from "./marketing-section";

export function MarketingHero() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 marketing-hero-glow"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-forge-ember/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-forge-gold/10 blur-3xl"
        aria-hidden
      />

      <div
        className={`${marketingWideClass} relative grid items-center gap-10 pb-16 pt-12 sm:gap-12 sm:pb-20 sm:pt-14 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-16`}
      >
        <div className="space-y-6 sm:space-y-7">
          <p className="font-display inline-flex items-center gap-2 rounded-full border border-forge-ember/30 bg-forge-ember/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-forge-gold sm:text-sm">
            <span
              className="h-1.5 w-1.5 rounded-full bg-forge-gold marketing-pulse-dot"
              aria-hidden
            />
            Evidence-based fitness app
          </p>

          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-forge-text sm:text-5xl lg:text-[3.25rem]">
            Train with a plan that{" "}
            <span className="bg-gradient-to-r from-forge-ember via-forge-glow to-forge-gold bg-clip-text text-transparent">
              holds you accountable
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-forge-muted sm:text-lg sm:leading-relaxed">
            Personalized workout programs, macro tracking, and weekly progress
            at a glance. Built for the gym — works offline when signal
            doesn&apos;t. Start free, upgrade when you&apos;re ready.
          </p>

          <ul className="flex flex-wrap gap-2 sm:gap-2.5">
            {heroPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-[var(--border)] bg-forge-surface-raised/80 px-3.5 py-1.5 text-xs font-semibold text-forge-text backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
              >
                {pill}
              </li>
            ))}
          </ul>

          <MarketingCtaButtons
            signupLabel="Create Free Account"
            layout="row"
          />
        </div>

        <div className="flex justify-center lg:justify-end">
          <MarketingAppPreview variant="hero" />
        </div>
      </div>
    </div>
  );
}
