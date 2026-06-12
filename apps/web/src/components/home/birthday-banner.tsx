interface BirthdayBannerProps {
  message: string;
}

export function BirthdayBanner({ message }: BirthdayBannerProps) {
  return (
    <section className="gradient-forge-celebrate rounded-2xl p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
        Happy birthday
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white">{message}</p>
    </section>
  );
}
