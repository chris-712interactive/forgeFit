import Link from "next/link";
import { footerNav } from "./marketing-data";
import { marketingWideClass } from "./marketing-section";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-forge-surface-raised/50">
      <div className={`${marketingWideClass} py-12 sm:py-14`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" aria-label="ForgeRep home">
              <img
                src="/logo.svg"
                alt=""
                className="h-10 w-auto"
                width={140}
                height={44}
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-forge-muted">
              Evidence-based fitness and nutrition. Personalized programs,
              offline workout logging, and macro tracking — mobile-first and
              built for the gym.
            </p>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-text">
              Product
            </h2>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Product links">
              {footerNav.product.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-forge-muted transition-colors hover:text-forge-ember"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-text">
              Account
            </h2>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Account links">
              {footerNav.account.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-forge-muted transition-colors hover:text-forge-ember"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-xs text-forge-muted sm:text-sm">
            © {new Date().getFullYear()} ForgeRep. All rights reserved.
          </p>
          <p className="text-xs text-forge-muted sm:text-sm">
            Mobile-first PWA · Works offline · Evidence-based
          </p>
        </div>
      </div>
    </footer>
  );
}
