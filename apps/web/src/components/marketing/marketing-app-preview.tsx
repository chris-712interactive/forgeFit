interface MarketingAppPreviewProps {
  variant?: "hero" | "inline";
}

export function MarketingAppPreview({
  variant = "inline",
}: MarketingAppPreviewProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={`relative ${isHero ? "marketing-float w-full max-w-[320px] sm:max-w-[340px] lg:max-w-[360px]" : "w-full"}`}
      aria-hidden
    >
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border border-[var(--border)] bg-forge-surface-raised p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/5">
        <div className="overflow-hidden rounded-[2rem] bg-forge-surface">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <span className="text-[10px] font-medium text-forge-muted">9:41</span>
            <div className="mx-auto h-5 w-24 rounded-full bg-black/40" />
            <span className="text-[10px] text-forge-muted">●●●</span>
          </div>

          <div className="space-y-3 px-3 pb-4">
            {/* App header */}
            <div className="px-1 pt-1">
              <p className="font-display text-[10px] font-semibold uppercase tracking-widest text-forge-gold">
                Home
              </p>
              <p className="font-display mt-0.5 text-lg font-bold text-forge-text">
                Hey, Alex
              </p>
            </div>

            {/* Encouragement */}
            <div className="gradient-forge-ignite rounded-xl p-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">
                Today&apos;s spark
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white">
                Three workouts in — real momentum this week.
              </p>
            </div>

            {/* Macros */}
            <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-forge-muted">
                Today&apos;s macros
              </p>
              <div className="mt-2.5 space-y-2.5">
                {[
                  { label: "Protein", pct: 78, color: "bg-forge-ember" },
                  { label: "Carbs", pct: 52, color: "bg-forge-gold" },
                  { label: "Fat", pct: 64, color: "bg-forge-steel" },
                ].map((macro) => (
                  <div key={macro.label}>
                    <div className="flex justify-between text-[9px] text-forge-muted">
                      <span>{macro.label}</span>
                      <span>{macro.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forge-surface">
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
            <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3.5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-forge-muted">
                    This week
                  </p>
                  <p className="font-display mt-1 text-xl font-bold text-forge-text">
                    3<span className="text-sm text-forge-muted">/4</span>
                  </p>
                </div>
                <p className="font-display text-lg font-bold text-forge-gold">
                  75%
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forge-surface">
                <div className="h-full w-3/4 rounded-full bg-forge-gold" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Volume", value: "24.5k lb" },
                { label: "Sets", value: "86 logged" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-lg border border-[var(--border)] bg-forge-surface px-2.5 py-2"
                >
                  <p className="text-[8px] font-medium uppercase tracking-wide text-forge-muted">
                    {tile.label}
                  </p>
                  <p className="font-display mt-0.5 text-sm font-bold text-forge-ember">
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isHero ? (
        <div
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-b from-forge-ember/20 to-transparent blur-2xl"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
