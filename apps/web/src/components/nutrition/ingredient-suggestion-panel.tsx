"use client";

import {
  WHOLE_FOOD_GROUPS,
  WHOLE_FOOD_GROUP_LABELS,
  type WholeFoodGroup,
} from "@forgefit/nutrition-core";
import { useState } from "react";

interface IngredientSuggestionPanelProps {
  searchQuery: string;
  inputClass: string;
}

export function IngredientSuggestionPanel({
  searchQuery,
  inputClass,
}: IngredientSuggestionPanelProps) {
  const [suggestedName, setSuggestedName] = useState(searchQuery.trim());
  const [categoryHint, setCategoryHint] = useState<WholeFoodGroup | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = suggestedName.trim();
    if (!name) {
      setError("Enter the ingredient name you'd like added.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/nutrition/ingredient-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
          suggestedName: name,
          categoryHint: categoryHint || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not submit suggestion.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Could not submit suggestion. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <li className="rounded-xl border border-forge-ember/30 bg-forge-ember/5 px-4 py-4 text-center">
        <p className="text-sm font-medium text-forge-text">Thanks — we got it!</p>
        <p className="mt-1 text-xs text-forge-muted">
          We&apos;ll review &ldquo;{suggestedName.trim()}&rdquo; for the ingredient
          list.
        </p>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-4">
      <p className="text-sm font-medium text-forge-text">
        Missing an ingredient?
      </p>
      <p className="mt-1 text-xs text-forge-muted">
        Suggest it and we&apos;ll review it for the library.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <label className="block">
          <span className="text-xs font-medium text-forge-muted">
            Ingredient name
          </span>
          <input
            type="text"
            value={suggestedName}
            onChange={(e) => setSuggestedName(e.target.value)}
            className={`${inputClass} mt-1 text-sm`}
            maxLength={200}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-forge-muted">
            Category (optional)
          </span>
          <select
            value={categoryHint}
            onChange={(e) =>
              setCategoryHint(e.target.value as WholeFoodGroup | "")
            }
            className={`${inputClass} mt-1 text-sm`}
          >
            <option value="">Not sure</option>
            {WHOLE_FOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {WHOLE_FOOD_GROUP_LABELS[group]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-forge-muted">
            Notes (optional)
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Brand, typical portion, etc."
            className={`${inputClass} mt-1 text-sm`}
            maxLength={500}
          />
        </label>
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] w-full rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Submit suggestion"}
        </button>
      </form>
    </li>
  );
}
