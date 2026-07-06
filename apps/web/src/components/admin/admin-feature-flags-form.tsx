"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  KNOWN_ADMIN_FEATURE_FLAGS,
  type AdminFeatureFlagKey,
} from "@/lib/admin/feature-flags-constants";

interface AdminFeatureFlagsFormProps {
  userId: string;
  initialFlags: Record<string, boolean>;
}

export function AdminFeatureFlagsForm({
  userId,
  initialFlags,
}: AdminFeatureFlagsFormProps) {
  const router = useRouter();
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function toggleFlag(key: AdminFeatureFlagKey) {
    setFlags((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${userId}/feature-flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flags, reason }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not save feature flags.");
      setLoading(false);
      return;
    }

    setMessage("Feature flags updated.");
    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4"
    >
      <h3 className="font-display text-sm font-semibold text-forge-text">
        Feature flags
      </h3>
      <p className="mt-1 text-xs text-forge-muted">
        Per-user overrides stored on the profile.
      </p>

      {message ? (
        <p className="mt-3 rounded-xl border border-forge-success/30 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {KNOWN_ADMIN_FEATURE_FLAGS.map((flag) => (
          <li key={flag.key} className="flex items-start gap-3">
            <input
              id={`flag-${flag.key}`}
              type="checkbox"
              checked={Boolean(flags[flag.key])}
              onChange={() => toggleFlag(flag.key)}
              className="mt-1"
            />
            <label htmlFor={`flag-${flag.key}`} className="text-sm">
              <span className="font-medium text-forge-text">{flag.label}</span>
              <span className="mt-0.5 block text-xs text-forge-muted">
                {flag.description}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <label className="mt-4 block text-xs font-medium text-forge-muted">
        Reason (min 10 characters)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={10}
          rows={2}
          className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-forge-text hover:bg-white/5 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save flags"}
      </button>
    </form>
  );
}
