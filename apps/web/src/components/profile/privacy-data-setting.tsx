"use client";

import { deleteAccount } from "@/app/actions/account";
import { clearOfflineUserData } from "@forgefit/offline-sync";
import { createClient } from "@/lib/supabase/client";
import { useState, useTransition } from "react";

interface PrivacyDataSettingProps {
  email: string;
  userId: string;
}

export function PrivacyDataSetting({ email, userId }: PrivacyDataSettingProps) {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleExport() {
    setExporting(true);
    setExportMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Could not export your data. Try again.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="([^"]+)"/)?.[1] ??
        `forgefit-export-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setExportMessage("Download started. Keep this file if you plan to delete your account.");
    } catch {
      setError("Could not export your data. Check your connection and try again.");
    } finally {
      setExporting(false);
    }
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmationEmail);
      if (result.error) {
        setError(result.error);
        return;
      }

      try {
        await clearOfflineUserData(userId);
      } catch {
        // Account is already gone server-side; local cleanup is best-effort.
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login?deleted=1";
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Privacy & data
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Download everything forgeFit stores about you, or permanently delete
        your account and all associated data.
      </p>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting || pending}
          className="min-h-[48px] w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40 disabled:opacity-60"
        >
          {exporting ? "Preparing export…" : "Export my data"}
        </button>

        {exportMessage && (
          <p className="text-sm text-forge-success">{exportMessage}</p>
        )}

        {!showDeleteForm ? (
          <button
            type="button"
            onClick={() => {
              setShowDeleteForm(true);
              setError(null);
            }}
            disabled={pending}
            className="min-h-[48px] w-full rounded-xl border border-forge-coral/30 px-4 py-3 text-sm font-semibold text-forge-coral transition-colors hover:border-forge-coral/60 disabled:opacity-60"
          >
            Delete my account
          </button>
        ) : (
          <div className="rounded-xl border border-forge-coral/30 bg-forge-coral/5 p-4">
            <p className="text-sm font-medium text-forge-text">
              This permanently deletes your account
            </p>
            <p className="mt-1 text-xs text-forge-muted">
              Your profile, programs, workouts, nutrition logs, measurements,
              and equipment settings will be removed from forgeFit. This cannot
              be undone. Export your data first if you want a copy.
            </p>

            <label className="mt-4 block text-xs font-medium text-forge-muted">
              Type your email to confirm
              <input
                type="email"
                value={confirmationEmail}
                onChange={(event) => setConfirmationEmail(event.target.value)}
                placeholder={email}
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2 text-sm text-forge-text"
              />
            </label>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={pending || !confirmationEmail.trim()}
                onClick={handleDelete}
                className="min-h-[44px] flex-1 rounded-lg bg-forge-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Permanently delete account"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setShowDeleteForm(false);
                  setConfirmationEmail("");
                  setError(null);
                }}
                className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-forge-coral">{error}</p>}
      </div>
    </section>
  );
}
