interface EncouragementBannerProps {
  message: string;
}

export function EncouragementBanner({ message }: EncouragementBannerProps) {
  return (
    <section className="gradient-forge-ignite rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
        Today&apos;s spark
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white">{message}</p>
    </section>
  );
}
