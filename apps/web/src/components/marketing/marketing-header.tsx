import Link from "next/link";
import { marketingWideClass } from "./marketing-section";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-forge-surface/80 backdrop-blur-xl">
      <div
        className={`${marketingWideClass} flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]`}
      >
        <Link href="/" className="shrink-0" aria-label="ForgeRep home">
          <img
            src="/logo.svg"
            alt=""
            className="h-9 w-auto sm:h-10"
            width={120}
            height={40}
          />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Marketing navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-forge-muted transition-colors hover:bg-white/5 hover:text-forge-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-forge-muted transition-colors hover:text-forge-text sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-forge-ember px-4 text-sm font-bold text-white transition-colors hover:bg-forge-glow active:scale-[0.98] sm:min-h-[48px] sm:px-5"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}
