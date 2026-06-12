interface PreWorkoutHypeBannerProps {
  message: string;
}

export function PreWorkoutHypeBanner({ message }: PreWorkoutHypeBannerProps) {
  return (
    <section className="rounded-2xl border border-forge-coral/35 bg-forge-surface-raised p-4 sm:p-5">
      <p className="font-display text-xs font-semibold uppercase tracking-wider text-forge-gold">
        Pre-workout focus
      </p>
      <p className="mt-2 text-sm leading-relaxed text-forge-text">{message}</p>
    </section>
  );
}
