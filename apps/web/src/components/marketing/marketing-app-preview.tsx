interface MarketingAppPreviewProps {
  variant?: "hero" | "inline";
}

/** ~iPhone 14 logical ratio (390×844) */
const PHONE_ASPECT = "aspect-[390/844]";

export function MarketingAppPreview({
  variant = "inline",
}: MarketingAppPreviewProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={`relative mx-auto ${
        isHero
          ? "marketing-float w-[240px] sm:w-[252px] lg:w-[260px]"
          : "w-[220px] sm:w-[240px] lg:w-[252px]"
      }`}
      aria-hidden
    >
      {/* Phone frame */}
      <div
        className={`${PHONE_ASPECT} rounded-[1.75rem] border border-[var(--border)] bg-forge-surface-raised p-[5px] shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:rounded-[2rem] sm:p-1.5`}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-forge-surface sm:rounded-[1.65rem]">
          {/* Status bar */}
          <div className="flex shrink-0 items-center justify-between px-3.5 pb-1.5 pt-2.5">
            <span className="text-[9px] font-medium text-forge-muted">9:41</span>
            <div className="h-[18px] w-[72px] rounded-full bg-black/40" />
            <span className="text-[9px] text-forge-muted">●●●</span>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-2.5 pb-3">
            {/* App header */}
            <div className="px-0.5">
              <p className="font-display text-[8px] font-semibold uppercase tracking-widest text-forge-gold">
                Home
              </p>
              <p className="font-display mt-0.5 text-base font-bold leading-tight text-forge-text">
                Hey, Alex
              </p>
            </div>

            {/* Encouragement */}
            <div className="gradient-forge-ignite rounded-lg p-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-wider text-white/70">
                Today&apos;s spark
              </p>
              <p className="mt-1 text-[10px] leading-snug text-white">
                Three workouts in — real momentum this week.
              </p>
            </div>

            {/* Macros */}
            <div className="rounded-lg border border-[var(--border)] bg-forge-surface-raised p-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-wider text-forge-muted">
                Today&apos;s macros
              </p>
              <div className="mt-2 space-y-2">
                {[
                  { label: "Protein", pct: 78, color: "bg-forge-ember" },
                  { label: "Carbs", pct: 52, color: "bg-forge-gold" },
                  { label: "Fat", pct: 64, color: "bg-forge-steel" },
                ].map((macro) => (
                  <div key={macro.label}>
                    <div className="flex justify-between text-[8px] text-forge-muted">
                      <span>{macro.label}</span>
                      <span>{macro.pct}%</span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-forge-surface">
                      <div
                        className={`h-full rounded-full ${macro.color}`}
                        style={{ width: `${macro.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly progress */}
            <div className="rounded-lg border border-[var(--border)] bg-forge-surface-raised p-2.5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-forge-muted">
                    This week
                  </p>
                  <p className="font-display mt-0.5 text-lg font-bold leading-none text-forge-text">
                    3<span className="text-xs text-forge-muted">/4</span>
                  </p>
                </div>
                <p className="font-display text-base font-bold text-forge-gold">75%</p>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-forge-surface">
                <div className="h-full w-3/4 rounded-full bg-forge-gold" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Volume", value: "24.5k lb" },
                { label: "Sets", value: "86 logged" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-md border border-[var(--border)] bg-forge-surface px-2 py-1.5"
                >
                  <p className="text-[7px] font-medium uppercase tracking-wide text-forge-muted">
                    {tile.label}
                  </p>
                  <p className="font-display mt-0.5 text-xs font-bold text-forge-ember">
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom fade — suggests scrollable content */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-forge-surface to-transparent"
            aria-hidden
          />
        </div>
      </div>

      {isHero ? (
        <div
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[2.25rem] bg-gradient-to-b from-forge-ember/20 to-transparent blur-2xl"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
