"use client";

import {
  clearUserOneRepMax,
  saveUserOneRepMax,
} from "@/app/actions/one-rep-maxes";
import { readActionError } from "@/lib/auth/action-result";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { buildEvidenceHref } from "@/lib/evidence/present";
import {
  ONE_REP_MAX_LIFTS,
  type OneRepMaxLiftId,
} from "@/lib/progression/one-rep-max-lifts";
import type { UserOneRepMaxRow } from "@/lib/progression/user-maxes";
import {
  kgFromDisplayValue,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface OneRepMaxSettingProps {
  initialMaxes: UserOneRepMaxRow[];
  tableReady?: boolean;
}

export function OneRepMaxSetting({
  initialMaxes,
  tableReady = true,
}: OneRepMaxSettingProps) {
  const unit = useUnitPreference();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const initialDisplay = useMemo(() => {
    const map = new Map(
      initialMaxes.map((row) => [
        row.exerciseId,
        String(kgToDisplayValue(row.weightKg, unit)),
      ])
    );
    return map;
  }, [initialMaxes, unit]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const record: Record<string, string> = {};
    for (const lift of ONE_REP_MAX_LIFTS) {
      record[lift.exerciseId] = initialDisplay.get(lift.exerciseId) ?? "";
    }
    return record;
  });

  useEffect(() => {
    const record: Record<string, string> = {};
    for (const lift of ONE_REP_MAX_LIFTS) {
      record[lift.exerciseId] = initialDisplay.get(lift.exerciseId) ?? "";
    }
    setValues(record);
  }, [initialDisplay]);

  const weightLabel = weightUnitLabel(unit);

  function updateValue(exerciseId: string, value: string) {
    setValues((prev) => ({ ...prev, [exerciseId]: value }));
    setSavedId(null);
    setError(null);
  }

  function saveLift(exerciseId: OneRepMaxLiftId) {
    const raw = values[exerciseId]?.trim();
    if (!raw) {
      startTransition(async () => {
        setError(null);
        const result = await clearUserOneRepMax(exerciseId);
        const actionError = readActionError(result);
        if (actionError) {
          setError(actionError);
          return;
        }
        setSavedId(exerciseId);
        router.refresh();
      });
      return;
    }

    const display = Number(raw);
    if (!Number.isFinite(display) || display <= 0) {
      setError("Enter a positive number or leave blank to clear.");
      return;
    }

    const weightKg = kgFromDisplayValue(display, unit);

    startTransition(async () => {
      setError(null);
      const result = await saveUserOneRepMax(exerciseId, weightKg);
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      setSavedId(exerciseId);
      router.refresh();
    });
  }

  if (!tableReady) {
    return (
      <section className="rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-5">
        <h2 className="font-display text-sm font-semibold text-forge-text">
          Known one-rep maxes
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Apply the `user_one_rep_maxes` migration to save your lift maxes and
          improve workout prescriptions.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Known one-rep maxes
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Optional — anchors weekly weight suggestions as a % of your max. We still
        update from logged sets when you prove you&apos;re stronger.
      </p>

      <div className="mt-4 space-y-3">
        {ONE_REP_MAX_LIFTS.map((lift) => (
          <div
            key={lift.exerciseId}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <label className="min-w-0 flex-1 text-sm">
              <span className="mb-1 block font-medium text-forge-text">
                {lift.label}
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={unit === "imperial" ? 2.5 : 0.5}
                  placeholder={`1RM (${weightLabel})`}
                  value={values[lift.exerciseId] ?? ""}
                  disabled={pending}
                  onChange={(event) =>
                    updateValue(lift.exerciseId, event.target.value)
                  }
                  className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-base text-forge-text outline-none focus:border-forge-ember"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => saveLift(lift.exerciseId)}
                  className="min-h-[48px] shrink-0 rounded-xl border border-forge-steel/50 px-4 text-sm font-semibold text-forge-steel hover:border-forge-ember hover:text-forge-ember disabled:opacity-60"
                >
                  Save
                </button>
              </div>
              {savedId === lift.exerciseId && (
                <span className="mt-1 block text-xs text-forge-success">
                  Saved
                </span>
              )}
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <EvidenceExplainerLink
          href={buildEvidenceHref({ focus: "rir_autoregulation" })}
          label="How we use your 1RM"
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
