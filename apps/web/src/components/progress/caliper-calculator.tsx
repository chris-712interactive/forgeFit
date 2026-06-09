"use client";

import type { CaliperFormula } from "@forgefit/projection-engine";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const inputClass =
  "min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 text-forge-text outline-none focus:border-forge-ember";

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
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-forge-muted">Formula</span>
          <select
            className={inputClass}
            value={formula}
            onChange={(event) =>
              setFormula(event.target.value as CaliperFormula)
            }
          >
            <option value="jp3">Jackson-Pollock 3-site</option>
            <option value="jp7">Jackson-Pollock 7-site</option>
          </select>
        </label>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-forge-muted">Sex</span>
          <select
            className={inputClass}
            value={selectedSex}
            onChange={(event) =>
              setSelectedSex(event.target.value as "male" | "female")
            }
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
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
