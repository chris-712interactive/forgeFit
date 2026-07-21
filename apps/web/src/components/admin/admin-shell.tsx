"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/revenue", label: "Revenue", exact: false },
  { href: "/admin/growth", label: "Growth", exact: false },
  { href: "/admin/partners", label: "Partners", exact: false },
  { href: "/admin/community", label: "Community", exact: false },
  { href: "/admin/broadcast", label: "Broadcast", exact: false },
  { href: "/admin/ingredients", label: "Ingredients", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/admins", label: "Admins", exact: false },
  { href: "/admin/audit", label: "Audit log", exact: false },
] as const;

interface AdminShellProps {
  adminEmail?: string;
  children: React.ReactNode;
}

export function AdminShell({ adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh overflow-x-clip bg-forge-surface text-forge-text">
      <div className="mx-auto grid min-h-dvh w-full min-w-0 max-w-[1400px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-white/10 bg-forge-surface lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forge-ember to-forge-gold font-display text-sm font-extrabold text-white">
              F
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold">ForgeRep</p>
              <p className="text-xs text-forge-muted">Admin Console</p>
            </div>
          </div>

          <nav className="flex max-w-full gap-1 overflow-x-auto overscroll-x-contain px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:px-2 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-forge-ember/15 text-forge-text ring-1 ring-inset ring-forge-ember/30"
                      : "text-forge-muted hover:bg-white/5 hover:text-forge-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden px-4 py-5 lg:block">
            <p className="text-xs text-forge-muted">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium">
              {adminEmail ?? "Admin"}
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block text-xs font-medium text-forge-ember hover:underline"
            >
              Member login →
            </Link>
          </div>
        </aside>

        <main className="min-w-0 max-w-full overflow-x-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
