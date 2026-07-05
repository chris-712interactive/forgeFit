import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

interface AlreadySignedInProps {
  email?: string | null;
  continueHref: string;
  continueLabel: string;
}

export function AlreadySignedIn({
  email,
  continueHref,
  continueLabel,
}: AlreadySignedInProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <p className="text-sm text-forge-muted">
        You&apos;re already signed in
        {email ? (
          <>
            {" "}
            as <span className="font-medium text-forge-text">{email}</span>
          </>
        ) : null}
        .
      </p>
      <Link
        href={continueHref}
        className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white transition-colors hover:bg-forge-glow"
      >
        {continueLabel}
      </Link>
      <SignOutButton />
      <p className="text-center text-xs text-forge-muted">
        Sign out to use a different account.
      </p>
    </div>
  );
}
