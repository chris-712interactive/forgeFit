import type { LeagueTier } from "@/lib/coaching/types";

const TIER_STYLES: Record<
  LeagueTier,
  { border: string; bg: string; text: string }
> = {
  bronze: {
    border: "border-amber-700/40",
    bg: "bg-amber-900/20",
    text: "text-amber-200",
  },
  silver: {
    border: "border-slate-400/40",
    bg: "bg-slate-400/10",
    text: "text-slate-200",
  },
  gold: {
    border: "border-forge-gold/40",
    bg: "bg-forge-gold/10",
    text: "text-forge-gold",
  },
};

interface LeagueTierBadgeProps {
  tier: LeagueTier;
  label: string;
  size?: "sm" | "md";
}

export function LeagueTierBadge({
  tier,
  label,
  size = "sm",
}: LeagueTierBadgeProps) {
  const styles = TIER_STYLES[tier];
  const sizeClass =
    size === "md"
      ? "px-3 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${styles.border} ${styles.bg} ${styles.text} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
