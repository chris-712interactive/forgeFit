"use client";

import { updateUnitSystem } from "@/app/actions/profile";
import {
  UNIT_SYSTEM_TILES,
  type UnitSystem,
} from "@/lib/units/measurements";
import { useUnitPreferenceActions } from "@/components/units/unit-preference-provider";
import { useState, useTransition } from "react";

interface UnitPreferenceSettingProps {
  initialUnit: UnitSystem;
}

export function UnitPreferenceSetting({
  initialUnit,
}: UnitPreferenceSettingProps) {
  const actions = useUnitPreferenceActions();
  const [unit, setLocalUnit] = useState<UnitSystem>(initialUnit);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function selectUnit(next: UnitSystem) {
    if (next === unit || pending) return;
    const previous = unit;
    setError(null);
    setLocalUnit(next);
    actions?.setUnit(next);

    startTransition(async () => {
      const result = await updateUnitSystem(next);
      if (result.error) {
        setError(result.error);
        setLocalUnit(previous);
        actions?.setUnit(previous);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Measurement units
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Used across progress logs, workouts, and your profile. Data is always
        stored in metric behind the scenes.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {UNIT_SYSTEM_TILES.map((tile) => (
          <button
            key={tile.value}
            type="button"
            disabled={pending}
            onClick={() => selectUnit(tile.value)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
              unit === tile.value
                ? "border-forge-ember bg-forge-ember/10"
                : "border-[var(--border)] bg-forge-surface hover:border-forge-ember/40"
            }`}
          >
            <p className="font-medium text-forge-text">{tile.label}</p>
            <p className="mt-1 text-xs text-forge-muted">{tile.description}</p>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-forge-coral">{error}</p>}
    </section>
  );
}
