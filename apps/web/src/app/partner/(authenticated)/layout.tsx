import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requirePartnerPortalUser } from "@/lib/partners/portal";

export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requirePartnerPortalUser();

  return (
    <div className="min-h-dvh bg-forge-surface text-forge-text">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-sm font-bold">ForgeRep Partners</p>
            <p className="text-xs text-forge-muted">
              {ctx.partnerName} · {ctx.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/partner"
              className="text-sm font-medium text-forge-ember hover:underline"
            >
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
