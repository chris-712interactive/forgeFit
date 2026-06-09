"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  cmFromDisplayValue,
  kgFromDisplayValue,
  lengthUnitLabel,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

interface LogMeasurementFormProps {
  defaultDate?: string;
}

export function LogMeasurementForm({ defaultDate }: LogMeasurementFormProps) {
  const router = useRouter();
  const unit = useUnitPreference();
  const [saving, setSaving] = useState(false);
  const [measuredDate, setMeasuredDate] = useState(
    defaultDate ?? new Date().toISOString().slice(0, 10)
  );
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");

  const weightLabel = weightUnitLabel(unit);
  const lengthLabel = lengthUnitLabel(unit);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!weight && !waist) {
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
          weightKg: weight
            ? kgFromDisplayValue(Number(weight), unit)
            : undefined,
          waistCm: waist
            ? cmFromDisplayValue(Number(waist), unit)
            : undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Could not save measurement");
      }

      setWeight("");
      setWaist("");
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
          <span className="mb-1 block text-forge-muted">
            Weight ({weightLabel})
          </span>
          <input
            type="number"
            step="0.1"
            min={unit === "imperial" ? 66 : 30}
            max={unit === "imperial" ? 660 : 300}
            className={inputClass}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder={unit === "imperial" ? "160" : "72.5"}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-forge-muted">
            Waist ({lengthLabel})
          </span>
          <input
            type="number"
            step="0.1"
            min={unit === "imperial" ? 12 : 30}
            max={unit === "imperial" ? 100 : 250}
            className={inputClass}
            value={waist}
            onChange={(event) => setWaist(event.target.value)}
            placeholder={unit === "imperial" ? "32" : "82"}
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
