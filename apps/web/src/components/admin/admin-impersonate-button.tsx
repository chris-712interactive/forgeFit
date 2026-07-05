"use client";

import { useState } from "react";

interface AdminImpersonateButtonProps {
  userId: string;
  email: string | null;
}

export function AdminImpersonateButton({
  userId,
  email,
}: AdminImpersonateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImpersonate() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
      method: "POST",
    });
    const body = (await response.json()) as {
      error?: string;
      redirect?: string;
    };

    if (!response.ok) {
      setError(body.error ?? "Could not start impersonation.");
      setLoading(false);
      return;
    }

    window.location.href = body.redirect ?? "/home";
  }

  return (
    <div className="rounded-2xl border border-forge-steel/20 bg-forge-steel/5 p-5">
      <h3 className="font-display text-sm font-bold text-forge-text">
        View as member
      </h3>
      <p className="mt-2 text-sm text-forge-muted">
        Open the member app read-only as{" "}
        <span className="font-medium text-forge-text">
          {email ?? "this user"}
        </span>
        . Your admin session stays active; mutations are blocked.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleImpersonate}
        disabled={loading}
        className="mt-4 min-h-[44px] rounded-xl bg-forge-steel px-4 text-sm font-semibold text-forge-surface transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Starting…" : "View as user"}
      </button>
    </div>
  );
}
