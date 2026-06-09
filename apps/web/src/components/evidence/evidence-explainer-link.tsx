import Link from "next/link";

export function EvidenceExplainerLink({
  href,
  label = "View evidence & sources",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-forge-steel transition-colors hover:text-forge-ember"
    >
      {label}
      <span aria-hidden>→</span>
    </Link>
  );
}
