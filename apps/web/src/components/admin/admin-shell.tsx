"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/revenue", label: "Revenue", exact: false },
  { href: "/admin/growth", label: "Growth", exact: false },
  { href: "/admin/community", label: "Community", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/audit", label: "Audit log", exact: false },
] as const;

interface AdminShellProps {
  adminEmail?: string;
  children: React.ReactNode;
}

export function AdminShell({ adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-forge-surface text-forge-text">
      <div className="mx-auto grid min-h-dvh max-w-[1400px] lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-white/10 bg-forge-surface lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forge-ember to-forge-gold font-display text-sm font-extrabold text-white">
              F
            </div>
            <div>
              <p className="font-display text-sm font-bold">ForgeRep</p>
              <p className="text-xs text-forge-muted">Admin Console</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-2 lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
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

        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
