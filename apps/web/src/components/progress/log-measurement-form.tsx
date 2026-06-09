"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

interface LogMeasurementFormProps {
  defaultDate?: string;
}

export function LogMeasurementForm({ defaultDate }: LogMeasurementFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [measuredDate, setMeasuredDate] = useState(
    defaultDate ?? new Date().toISOString().slice(0, 10)
  );
  const [weightKg, setWeightKg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!weightKg && !waistCm) {
      window.alert("Enter at least weight or waist.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measuredDate,
          weightKg: weightKg ? Number(weightKg) : undefined,
          waistCm: waistCm ? Number(waistCm) : undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Could not save measurement");
      }

      setWeightKg("");
      setWaistCm("");
      setNotes("");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not save measurement."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-forge-muted">Date</span>
        <input
          type="date"
          className={inputClass}
          value={measuredDate}
          onChange={(event) => setMeasuredDate(event.target.value)}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-forge-muted">Weight (kg)</span>
          <input
            type="number"
            step="0.1"
            min="30"
            max="300"
            className={inputClass}
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            placeholder="72.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-forge-muted">Waist (cm)</span>
          <input
            type="number"
            step="0.1"
            min="30"
            max="250"
            className={inputClass}
            value={waistCm}
            onChange={(event) => setWaistCm(event.target.value)}
            placeholder="82"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-forge-muted">Notes (optional)</span>
        <input
          type="text"
          className={inputClass}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Morning, fasted"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="min-h-[48px] w-full rounded-xl bg-forge-ember px-4 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Log measurement"}
      </button>
    </form>
  );
}
