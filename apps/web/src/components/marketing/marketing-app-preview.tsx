import type { ReactNode } from "react";

interface MarketingAppPreviewProps {
  variant?: "hero" | "inline";
}

/** ~iPhone 14 logical ratio (390×844) */
const PHONE_ASPECT = "aspect-[390/844]";

const SESSION_BARS = [1, 0, 1, 0, 0, 0, 0] as const;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

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
      <div
        className={`${PHONE_ASPECT} rounded-[1.75rem] border border-[var(--border)] bg-forge-surface-raised p-[5px] shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:rounded-[2rem] sm:p-1.5`}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-forge-surface sm:rounded-[1.65rem]">
          <div className="flex shrink-0 items-center justify-between px-3.5 pb-1.5 pt-2.5">
            <span className="text-[9px] font-medium text-forge-muted">9:41</span>
            <div className="h-[18px] w-[72px] rounded-full bg-black/40" />
            <span className="text-[9px] text-forge-muted">●●●</span>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-2.5 pb-2">
            <div className="px-0.5">
              <p className="text-[8px] text-forge-muted">Saturday, Jul 4</p>
              <p className="font-display mt-0.5 text-[15px] font-bold leading-tight text-forge-text">
                Hey, Alex
              </p>
            </div>

            {/* Hero — next session */}
            <div className="rounded-xl border border-forge-ember/25 bg-forge-ember/5 p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-forge-gold/40 bg-forge-gold/10 px-1.5 py-px text-[6px] font-semibold uppercase tracking-wide text-forge-gold">
                  Today
                </span>
                <span className="text-[7px] text-forge-muted">2 of 4 this week</span>
              </div>
              <p className="font-display mt-1.5 text-[13px] font-bold leading-tight text-forge-text">
                Upper Body A
              </p>
              <p className="mt-0.5 text-[7px] leading-snug text-forge-muted">
                Push day · ~45 min · 4 exercises
              </p>
              <p className="mt-1 text-[7px] italic leading-snug text-forge-muted">
                42g protein left to fuel recovery.
              </p>
              <div className="mt-2 rounded-lg bg-forge-ember py-1.5 text-center">
                <span className="font-display text-[8px] font-bold text-white">
                  Start Upper Body A
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-2 text-[6px] font-semibold">
                <span className="text-forge-steel">Log food</span>
                <span className="text-forge-muted">·</span>
                <span className="text-forge-steel">View week plan</span>
              </div>
            </div>

            {/* Domain carousel */}
            <div>
              <div className="mb-1 flex items-baseline justify-between px-0.5">
                <p className="text-[7px] font-semibold uppercase tracking-wider text-forge-muted">
                  Your week
                </p>
                <p className="text-[6px] text-forge-muted">Swipe</p>
              </div>

              <div className="-mx-0.5 flex gap-1.5 overflow-hidden px-0.5">
                <PreviewDomainCard
                  title="Training"
                  titleClassName="text-forge-gold"
                  link="Workout →"
                  headline="2 / 4"
                  subline="Upper Body A is next"
                >
                  <div className="mt-1 flex h-8 items-end justify-between gap-px">
                    {SESSION_BARS.map((value, index) => (
                      <div key={DAY_LABELS[index]} className="flex flex-1 flex-col items-center gap-0.5">
                        <div
                          className={`w-full rounded-sm ${value ? "bg-forge-gold" : "bg-forge-surface"}`}
                          style={{ height: value ? `${value * 100}%` : "18%" }}
                        />
                        <span className="text-[5px] text-forge-muted">{DAY_LABELS[index]}</span>
                      </div>
                    ))}
                  </div>
                </PreviewDomainCard>

                <PreviewDomainCard
                  title="Nutrition"
                  titleClassName="text-forge-coral"
                  link="Diary →"
                  headline="118g"
                  subline="42g protein left"
                  peek
                >
                  <div className="mt-2 space-y-1.5">
                    <PreviewMacroBar label="Protein" pct={74} color="bg-forge-coral" />
                    <PreviewMacroBar label="Calories" pct={77} color="bg-forge-ember" />
                  </div>
                </PreviewDomainCard>
              </div>

              <div className="mt-1.5 flex items-center justify-center gap-1">
                {[0, 1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={`h-1 rounded-full ${
                      dot === 0 ? "w-2.5 bg-forge-ember" : "w-1 bg-forge-muted/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom nav hint */}
          <div className="shrink-0 border-t border-[var(--border)] bg-forge-surface-raised px-1 py-1.5">
            <div className="flex justify-around">
              {["Home", "Workout", "Nutrition", "Progress", "More"].map((item) => (
                <div key={item} className="flex flex-col items-center gap-0.5">
                  <div
                    className={`h-2 w-2 rounded-sm ${
                      item === "Home" ? "bg-forge-ember/40 ring-1 ring-forge-ember/50" : "bg-forge-muted/30"
                    }`}
                  />
                  <span
                    className={`text-[5px] ${
                      item === "Home" ? "font-semibold text-forge-ember" : "text-forge-muted"
                    }`}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-10 h-8 bg-gradient-to-t from-forge-surface to-transparent"
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

function PreviewDomainCard({
  title,
  titleClassName,
  link,
  headline,
  subline,
  peek = false,
  children,
}: {
  title: string;
  titleClassName: string;
  link: string;
  headline: string;
  subline: string;
  peek?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`shrink-0 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-2 ${
        peek ? "w-[38%] opacity-90" : "w-[68%]"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <p
          className={`font-display text-[6px] font-semibold uppercase tracking-wider ${titleClassName}`}
        >
          {title}
        </p>
        <span className="text-[6px] font-semibold text-forge-steel">{link}</span>
      </div>
      <p className="font-display mt-1 text-[14px] font-bold leading-none tabular-nums text-forge-text">
        {headline}
      </p>
      <p className="mt-0.5 text-[6px] leading-snug text-forge-muted">{subline}</p>
      {children}
    </div>
  );
}

function PreviewMacroBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[5px] text-forge-muted">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-forge-surface">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
