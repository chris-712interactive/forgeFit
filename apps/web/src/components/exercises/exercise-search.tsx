"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

interface ExerciseSearchProps {
  total: number;
}

export function ExerciseSearch({ total }: ExerciseSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`/exercises?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-forge-muted">{total.toLocaleString()} exercises in library</p>
      <input
        type="search"
        className={inputClass}
        placeholder="Search by name, muscle, or equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            updateParam("q", query.trim());
          }
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          className={inputClass}
          defaultValue={searchParams.get("pattern") ?? ""}
          onChange={(event) => updateParam("pattern", event.target.value)}
        >
          <option value="">All patterns</option>
          <option value="squat">Squat</option>
          <option value="hinge">Hinge</option>
          <option value="horizontal_push">Horizontal push</option>
          <option value="vertical_push">Vertical push</option>
          <option value="horizontal_pull">Horizontal pull</option>
          <option value="vertical_pull">Vertical pull</option>
          <option value="core">Core</option>
          <option value="isolation_arms">Arms</option>
          <option value="isolation_legs">Legs</option>
          <option value="cardio">Cardio</option>
        </select>
        <select
          className={inputClass}
          defaultValue={searchParams.get("muscle") ?? ""}
          onChange={(event) => updateParam("muscle", event.target.value)}
        >
          <option value="">All muscles</option>
          <option value="chest">Chest</option>
          <option value="back">Back</option>
          <option value="shoulders">Shoulders</option>
          <option value="quadriceps">Quads</option>
          <option value="hamstrings">Hamstrings</option>
          <option value="glutes">Glutes</option>
          <option value="biceps">Biceps</option>
          <option value="triceps">Triceps</option>
          <option value="core">Core</option>
        </select>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => updateParam("q", query.trim())}
        className="min-h-[44px] w-full rounded-xl bg-forge-ember px-4 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Searching…" : "Search"}
      </button>
    </div>
  );
}
