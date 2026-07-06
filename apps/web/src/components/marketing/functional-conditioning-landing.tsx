import Link from "next/link";
import { MarketingCtaButtons } from "./marketing-cta-buttons";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import { marketingContentClass, marketingWideClass } from "./marketing-section";

const highlights = [
  {
    title: "Hybrid weekly split",
    body: "Most days are compound strength work. One or two sessions are dedicated conditioning circuits — scaled to your schedule.",
  },
  {
    title: "Fixed rounds + AMRAP",
    body: "Build work capacity with structured round targets, then push pace on time-capped AMRAP days when you're ready.",
  },
  {
    title: "Metabolic finishers",
    body: "On strength-focused goals, optional short finishers cap the session without replacing your main lifts.",
  },
  {
    title: "Offline in the gym",
    body: "Log circuits and sets without signal. ForgeRep syncs when you're back online — same PWA as the rest of the app.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Pick Functional conditioning",
    body: "Choose it as your primary goal in onboarding — available for ages 13+ with the same evidence engine as every other path.",
  },
  {
    step: "02",
    title: "Get a hybrid plan",
    body: "Programs mix squat, push, hinge, and carry patterns on strength days, plus mixed-modal circuits matched to your equipment.",
  },
  {
    step: "03",
    title: "Train and track",
    body: "Run warm-ups, lifts, circuits, and finishers in one flow. See weekly volume and habit score when you opt into community.",
  },
] as const;

export function FunctionalConditioningLanding() {
  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
      <MarketingHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div
            className="pointer-events-none absolute inset-0 marketing-hero-glow"
            aria-hidden
          />
          <div
            className={`${marketingWideClass} relative grid gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16`}
          >
            <div className="space-y-6">
              <p className="font-display inline-flex rounded-full border border-forge-coral/30 bg-forge-coral/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-forge-coral">
                Functional conditioning
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
                Strength plus circuits —{" "}
                <span className="bg-gradient-to-r from-forge-ember via-forge-glow to-forge-gold bg-clip-text text-transparent">
                  more work in less time
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-forge-muted sm:text-lg">
                ForgeRep is a functional conditioning app that builds real
                programs — not random WOD generators. Compound strength days,
                structured circuits, AMRAP time caps, and optional metabolic
                finishers on other goals.
              </p>
              <MarketingCtaButtons
                variant="default"
                signupLabel="Start free — build your plan"
                layout="row"
              />
              <p className="text-xs text-forge-muted">
                Generic training terms only — ForgeRep is not affiliated with
                any branded mixed-modal gym franchise.
              </p>
            </div>

            <div className="rounded-2xl border border-forge-coral/25 bg-forge-surface-raised p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-coral">
                Example week · 4 sessions
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Strength A — squat, push, pull",
                  "Strength B — hinge, press, pull",
                  "Conditioning — 4 rounds · mixed circuit",
                  "Strength C + 5 min finisher AMRAP",
                ].map((line) => (
                  <li
                    key={line}
                    className="rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3 text-sm text-forge-text"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={`${marketingWideClass} py-16 sm:py-20`}>
          <div className={`${marketingContentClass} mb-10 space-y-3`}>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Built for mixed-modal training
            </h2>
            <p className="text-forge-muted">
              Program logic lives in ForgeRep&apos;s evidence engine — never
              LLM-generated workouts. Every circuit cites volume and recovery
              rules from the knowledge base.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5"
              >
                <h3 className="font-display text-lg font-semibold text-forge-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-forge-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-forge-surface-raised/40">
          <div className={`${marketingWideClass} py-16 sm:py-20`}>
            <h2 className="font-display mb-10 text-center text-2xl font-bold sm:text-3xl">
              How it works
            </h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {steps.map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border border-[var(--border)] bg-forge-surface p-5"
                >
                  <p className="font-display text-sm font-bold text-forge-ember">
                    {item.step}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-forge-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${marketingWideClass} py-16 sm:py-20`}>
          <div className="rounded-2xl border border-forge-ember/25 bg-gradient-to-br from-forge-ember/10 to-forge-gold/5 p-8 text-center sm:p-12">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Ready to train smarter?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-forge-muted">
              Free tier includes program generation, offline logging, and
              nutrition tracking. Upgrade for 90-day projections, analytics, and
              community when you need them.
            </p>
            <div className="mt-8 flex justify-center">
              <MarketingCtaButtons layout="row" />
            </div>
            <p className="mt-6 text-sm text-forge-muted">
              Also read our{" "}
              <Link
                href="/guides/functional-conditioning-app"
                className="font-medium text-forge-ember underline-offset-2 hover:underline"
              >
                functional conditioning guide
              </Link>
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
