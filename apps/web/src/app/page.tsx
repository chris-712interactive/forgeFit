export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface text-forge-text">
      <header className="gradient-forge-ignite px-6 pb-12 pt-10">
        <img
          src="/logo.svg"
          alt="forgeFit"
          className="mb-4 h-auto w-full max-w-[280px]"
          width={280}
          height={109}
        />
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-white/80">
          Your fitness journey starts here
        </p>
        <p className="mt-3 max-w-sm text-base text-white/90">
          Evidence-based workouts and nutrition — built for the gym, works offline
          when signal doesn&apos;t.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <section className="rounded-2xl bg-forge-surface-raised p-5">
          <h2 className="font-display text-lg font-bold text-forge-gold">
            Phase 0 complete soon
          </h2>
          <p className="mt-2 text-sm text-forge-muted">
            Scaffold is live. Next up: onboarding, your personalized program, and
            offline workout tracking.
          </p>
        </section>

        <section className="grid gap-3">
          {[
            { label: "Programs", desc: "Fat loss, strength, bodybuilding & more" },
            { label: "Track", desc: "Sets, reps, calories, measurements" },
            { label: "Offline", desc: "Log workouts with no Wi‑Fi" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4"
            >
              <div className="h-10 w-1 rounded-full bg-forge-ember" />
              <div>
                <p className="font-display font-semibold">{item.label}</p>
                <p className="text-sm text-forge-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <a
          href="/signup"
          className="mt-auto flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-base font-bold text-white transition-colors hover:bg-forge-glow active:scale-[0.98]"
        >
          Get Started
        </a>
        <a
          href="/login"
          className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/30 font-medium text-white/90"
        >
          Sign In
        </a>
      </main>
    </div>
  );
}
