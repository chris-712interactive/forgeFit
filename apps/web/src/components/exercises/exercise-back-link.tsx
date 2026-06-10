import { sanitizeReturnTo } from "@/lib/navigation/return-to";
import Link from "next/link";

interface ExerciseBackLinkProps {
  returnTo?: string | null;
}

export function ExerciseBackLink({ returnTo }: ExerciseBackLinkProps) {
  const safeReturn = sanitizeReturnTo(returnTo);

  if (safeReturn) {
    return (
      <Link
        href={safeReturn}
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forge-ember hover:text-forge-ember/80"
      >
        ← Back to workout
      </Link>
    );
  }

  return (
    <Link
      href="/exercises"
      className="text-sm font-medium text-forge-steel hover:text-forge-ember"
    >
      ← Exercise library
    </Link>
  );
}
