import { MarketingSection, MarketingSectionIntro } from "./marketing-section";

export function MarketingDashboardPreview() {
  return (
    <MarketingSection variant="card">
      <MarketingSectionIntro
        eyebrow="Accountability at a glance"
        eyebrowClassName="text-forge-gold"
        title="Open the app. Know exactly where you stand."
        description="Your Home dashboard surfaces today's macros, this week's workouts, and the body of work you've already logged — before you dive into the full plan."
      />

      <div
        className="mt-6 space-y-4 rounded-xl border border-[var(--border)] bg-forge-surface p-5 sm:mt-8 sm:space-y-5 sm:p-6 md:p-7"
        aria-hidden
      >
        <div className="gradient-forge-ignite rounded-xl p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
            Today&apos;s spark
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white sm:text-sm">
            Three workouts in — you&apos;re building real momentum this week.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-forge-muted sm:text-xs">
            Today&apos;s macros
          </p>
          <div className="mt-3 space-y-3 sm:space-y-3.5">
            {[
              { label: "Protein", pct: 72, color: "bg-forge-ember" },
              { label: "Carbs", pct: 45, color: "bg-forge-gold" },
              { label: "Fat", pct: 58, color: "bg-forge-steel" },
            ].map((macro) => (
              <div key={macro.label}>
                <div className="flex justify-between text-[10px] text-forge-muted sm:text-xs">
                  <span>{macro.label}</span>
                  <span>{macro.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-forge-surface sm:mt-2">
                  <div
                    className={`h-full rounded-full ${macro.color}`}
                    style={{ width: `${macro.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-forge-muted sm:text-xs">
                This week
              </p>
              <p className="font-display mt-1.5 text-2xl font-bold text-forge-text sm:mt-2 sm:text-3xl">
                3<span className="text-base text-forge-muted sm:text-lg">/4</span>
              </p>
              <p className="mt-1 text-[10px] text-forge-muted sm:text-xs">
                workouts completed
              </p>
            </div>
            <p className="font-display text-xl font-bold text-forge-gold sm:text-2xl">
              75%
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-forge-surface sm:mt-4">
            <div className="h-full w-3/4 rounded-full bg-forge-gold" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Volume lifted", value: "24,500", unit: "lb" },
            { label: "Sets logged", value: "86", unit: "sets" },
            { label: "Cardio distance", value: "3.2", unit: "mi" },
            { label: "Recovery time", value: "45", unit: "min" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-3 sm:px-4 sm:py-4"
            >
              <p className="text-[9px] font-medium uppercase tracking-wide text-forge-muted sm:text-[10px]">
                {tile.label}
              </p>
              <p className="font-display mt-1 text-lg font-bold text-forge-ember sm:text-xl">
                {tile.value}
              </p>
              <p className="mt-0.5 text-[10px] text-forge-muted sm:text-xs">
                {tile.unit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MarketingSection>
  );
}
