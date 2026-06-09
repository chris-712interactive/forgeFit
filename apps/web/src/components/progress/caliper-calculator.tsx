"use client";

import type { CaliperFormula } from "@forgefit/projection-engine";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const inputClass =
  "min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-base text-forge-text outline-none focus:border-forge-ember";

const segmentButtonClass = (active: boolean) =>
  `min-h-[48px] rounded-xl border px-3 text-base font-medium transition-colors ${
    active
      ? "border-forge-ember bg-forge-ember/10 text-forge-text"
      : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-ember/40"
  }`;

interface CaliperCalculatorProps {
  sex: string | null;
  age: number | null;
}

type SkinfoldKey =
  | "chest"
  | "abdominal"
  | "thigh"
  | "tricep"
  | "suprailiac"
  | "midaxillary"
  | "subscapular";

const JP3_MALE: SkinfoldKey[] = ["chest", "abdominal", "thigh"];
const JP3_FEMALE: SkinfoldKey[] = ["tricep", "suprailiac", "thigh"];
const JP7: SkinfoldKey[] = [
  "chest",
  "midaxillary",
  "tricep",
  "subscapular",
  "abdominal",
  "suprailiac",
  "thigh",
];

const LABELS: Record<SkinfoldKey, string> = {
  chest: "Chest",
  abdominal: "Abdominal",
  thigh: "Thigh",
  tricep: "Tricep",
  suprailiac: "Suprailiac",
  midaxillary: "Midaxillary",
  subscapular: "Subscapular",
};

export function CaliperCalculator({ sex, age }: CaliperCalculatorProps) {
  const router = useRouter();
  const [formula, setFormula] = useState<CaliperFormula>("jp3");
  const [selectedSex, setSelectedSex] = useState<"male" | "female">(
    sex === "female" ? "female" : "male"
  );
  const [selectedAge, setSelectedAge] = useState(age ?? 30);
  const [measuredDate, setMeasuredDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [folds, setFolds] = useState<Partial<Record<SkinfoldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const activeSites = useMemo(() => {
    if (formula === "jp7") return JP7;
    return selectedSex === "female" ? JP3_FEMALE : JP3_MALE;
  }, [formula, selectedSex]);

  function setFold(key: SkinfoldKey, value: string) {
    setFolds((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const skinfolds = Object.fromEntries(
        activeSites.map((key) => [key, Number(folds[key] ?? 0)])
      );

      const response = await fetch("/api/measurements/caliper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measuredDate,
          formula,
          sex: selectedSex,
          age: selectedAge,
          skinfolds,
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Could not save caliper reading");
      }

      const data = (await response.json()) as {
        result?: { bodyFatPct: number };
      };
      setLastResult(data.result?.bodyFatPct ?? null);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not calculate body fat."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="mb-2 block text-sm text-forge-muted">Formula</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormula("jp3")}
            className={segmentButtonClass(formula === "jp3")}
          >
            3-site
          </button>
          <button
            type="button"
            onClick={() => setFormula("jp7")}
            className={segmentButtonClass(formula === "jp7")}
          >
            7-site
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <label className="block text-sm">
          <span className="mb-1 block text-forge-muted">Age</span>
          <input
            type="number"
            min={13}
            max={120}
            className={inputClass}
            value={selectedAge}
            onChange={(event) => setSelectedAge(Number(event.target.value))}
            required
          />
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm text-forge-muted">Sex</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedSex("male")}
            className={segmentButtonClass(selectedSex === "male")}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => setSelectedSex("female")}
            className={segmentButtonClass(selectedSex === "female")}
          >
            Female
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {activeSites.map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block text-forge-muted">
              {LABELS[key]} (mm)
            </span>
            <input
              type="number"
              step="0.5"
              min="0"
              className={inputClass}
              value={folds[key] ?? ""}
              onChange={(event) => setFold(key, event.target.value)}
              required
            />
          </label>
        ))}
      </div>

      {lastResult != null && (
        <p className="rounded-xl bg-forge-surface px-4 py-3 text-sm">
          Body fat:{" "}
          <span className="font-display text-lg font-bold text-forge-gold">
            {lastResult}%
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="min-h-[48px] w-full rounded-xl border border-forge-steel px-4 font-semibold text-forge-steel disabled:opacity-60"
      >
        {saving ? "Calculating…" : "Calculate & save"}
      </button>
    </form>
  );
}
