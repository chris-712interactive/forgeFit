"use client";

import { joinCrewByCode } from "@/app/actions/community";
import { readActionError } from "@/lib/auth/action-result";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityJoinClientProps {
  initialCode: string;
  previewName: string | null;
  previewMemberCount: number | null;
}

export function CommunityJoinClient({
  initialCode,
  previewName,
  previewMemberCount,
}: CommunityJoinClientProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setBusy(true);
    setError(null);
    const result = await joinCrewByCode(code);
    setBusy(false);

    if (!result.ok) {
      setError(readActionError(result) ?? "Could not join crew.");
      return;
    }

    router.push("/community");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-forge-text">
          Join a crew
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Enter an invite code from a teammate in your bucket.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        {previewName && (
          <p className="mb-4 text-sm text-forge-text">
            You&apos;re joining{" "}
            <span className="font-semibold text-forge-gold">{previewName}</span>
            {previewMemberCount != null && (
              <span className="text-forge-muted">
                {" "}
                · {previewMemberCount} member
                {previewMemberCount === 1 ? "" : "s"} so far
              </span>
            )}
          </p>
        )}

        <label className="block text-xs font-medium uppercase tracking-wide text-forge-muted">
          Invite code
        </label>
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={8}
          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2 font-mono text-sm uppercase tracking-widest text-forge-text"
        />

        <button
          type="button"
          disabled={busy || code.trim().length < 4}
          onClick={() => void handleJoin()}
          className="mt-4 w-full rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Join crew
        </button>

        {error && <p className="mt-3 text-xs text-forge-coral">{error}</p>}
      </section>

      <p className="text-center text-sm text-forge-muted">
        <Link
          href="/community"
          className="font-medium text-forge-ember underline-offset-2 hover:underline"
        >
          Back to Community
        </Link>
      </p>
    </div>
  );
}
