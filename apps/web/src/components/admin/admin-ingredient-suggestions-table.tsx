"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IngredientSuggestionRow } from "@/lib/admin/ingredient-suggestions";

interface AdminIngredientSuggestionsTableProps {
  suggestions: IngredientSuggestionRow[];
}

export function AdminIngredientSuggestionsTable({
  suggestions,
}: AdminIngredientSuggestionsTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(
    id: string,
    status: IngredientSuggestionRow["status"]
  ) {
    const reason = window.prompt(
      `Reason for marking as "${status}" (min 10 characters):`
    );
    if (!reason || reason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }

    setLoadingId(id);
    setError(null);

    const response = await fetch(`/api/admin/ingredient-suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason: reason.trim() }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Update failed.");
      setLoadingId(null);
      return;
    }

    router.refresh();
    setLoadingId(null);
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-forge-muted">
        No suggestions in this queue.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <div className="max-w-full overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-forge-surface-raised text-xs text-forge-muted">
              <th className="px-4 py-3 font-medium">Suggested name</th>
              <th className="px-4 py-3 font-medium">Search query</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-forge-text">{row.suggestedName}</p>
                  {row.categoryHint ? (
                    <p className="text-xs text-forge-muted">{row.categoryHint}</p>
                  ) : null}
                  {row.notes ? (
                    <p className="mt-1 text-xs text-forge-muted">{row.notes}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-forge-muted">{row.searchQuery}</td>
                <td className="px-4 py-3 text-forge-muted">
                  {row.userEmail ?? row.userId.slice(0, 8)}
                </td>
                <td className="px-4 py-3 capitalize text-forge-text">{row.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(["reviewed", "added", "rejected"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={loadingId === row.id || row.status === status}
                        onClick={() => updateStatus(row.id, status)}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium capitalize text-forge-text hover:bg-white/5 disabled:opacity-50"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
