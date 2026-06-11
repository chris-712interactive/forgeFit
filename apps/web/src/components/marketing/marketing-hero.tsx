import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { heroPills } from "./marketing-data";
import { marketingContentClass } from "./marketing-section";

export function MarketingHero() {
  return (
    <header className="gradient-forge-ignite pb-16 pt-10 sm:pb-20 sm:pt-12 md:pb-24 md:pt-14">
      <div
        className={`${marketingContentClass} space-y-5 sm:space-y-6 md:space-y-7`}
      >
        <img
          src="/logo.svg"
          alt="ForgeFit — evidence-based fitness and nutrition app"
          className="h-auto w-full max-w-[280px] sm:max-w-[300px]"
          width={280}
          height={109}
        />
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-white/80">
          Your fitness journey starts here
        </p>
        <h1 className="font-display max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl md:max-w-2xl md:text-[2.5rem] md:leading-tight">
          A plan that holds you accountable — not just another workout list
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed">
          Evidence-based programs, nutrition tracking, and weekly progress at a
          glance. Built for the gym. Works when signal doesn&apos;t.
        </p>
        <ul className="flex flex-wrap gap-2.5 pt-1 sm:gap-3 sm:pt-2">
          {heroPills.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
            >
              {pill}
            </li>
          ))}
        </ul>

        <div className="pt-2 sm:pt-4">
          <MarketingCtaButtons
            variant="hero"
            signupLabel="Get Started Free"
            layout="row"
          />
        </div>
      </div>
    </header>
  );
}
