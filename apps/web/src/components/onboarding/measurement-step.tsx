"use client";

import { useState } from "react";
import type { OnboardingData, SexType } from "@/lib/types/profile";
import {
  UNIT_OPTIONS,
  cmToFtIn,
  cmToIn,
  ftInToCm,
  inToCm,
  kgToLbs,
  lbsToKg,
  type UnitSystem,
} from "@/lib/units/measurements";

type MeasurementKey =
  | "height_cm"
  | "weight_kg"
  | "waist_cm"
  | "chest_cm"
  | "arms_cm"
  | "legs_cm"
  | "neck_cm"
  | "hips_cm";

const MEASUREMENT_FIELDS: {
  key: MeasurementKey;
  label: string;
  required?: boolean;
  kind: "height" | "weight" | "length";
}[] = [
  { key: "height_cm", label: "Height", required: true, kind: "height" },
  { key: "weight_kg", label: "Weight", required: true, kind: "weight" },
  { key: "waist_cm", label: "Waist", kind: "length" },
  { key: "chest_cm", label: "Chest", kind: "length" },
  { key: "arms_cm", label: "Arms", kind: "length" },
  { key: "legs_cm", label: "Legs", kind: "length" },
  { key: "neck_cm", label: "Neck", kind: "length" },
  { key: "hips_cm", label: "Hips", kind: "length" },
];

const DEFAULT_UNITS: Record<MeasurementKey, UnitSystem> = {
  height_cm: "metric",
  weight_kg: "metric",
  waist_cm: "metric",
  chest_cm: "metric",
  arms_cm: "metric",
  legs_cm: "metric",
  neck_cm: "metric",
  hips_cm: "metric",
};

interface MeasurementStepProps {
  data: Partial<OnboardingData>;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function MeasurementStep({ data, onChange }: MeasurementStepProps) {
  const [units, setUnits] =
    useState<Record<MeasurementKey, UnitSystem>>(DEFAULT_UNITS);

  function setUnit(key: MeasurementKey, unit: UnitSystem) {
    setUnits((prev) => ({ ...prev, [key]: unit }));
  }

  function setMetricValue(key: MeasurementKey, cmOrKg: number | undefined) {
    onChange({ [key]: cmOrKg });
  }

  return (
    <div className="space-y-4">
      <SelectField
        label="Sex"
        value={data.sex ?? ""}
        onChange={(v) => onChange({ sex: v as SexType })}
        options={[
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
          { value: "prefer_not_to_say", label: "Prefer not to say" },
        ]}
      />

      <NumberField
        label="Age"
        required
        value={data.age}
        onChange={(v) => onChange({ age: v })}
        min={13}
        max={120}
        suffix="years"
      />

      <p className="text-xs text-forge-muted">
        Pick Metric or Imperial per field — we save everything consistently behind
        the scenes.
      </p>

      <MeasurementField
        label="Height"
        required
        kind="height"
        unit={units.height_cm}
        onUnitChange={(u) => setUnit("height_cm", u)}
        metricValue={data.height_cm}
        onMetricChange={(v) => setMetricValue("height_cm", v)}
      />

      <MeasurementField
        label="Weight"
        required
        kind="weight"
        unit={units.weight_kg}
        onUnitChange={(u) => setUnit("weight_kg", u)}
        metricValue={data.weight_kg}
        onMetricChange={(v) => setMetricValue("weight_kg", v)}
      />

      <p className="text-sm text-forge-muted">Optional measurements</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MEASUREMENT_FIELDS.filter((f) => !f.required).map((field) => (
          <MeasurementField
            key={field.key}
            label={field.label}
            kind={field.kind}
            unit={units[field.key]}
            onUnitChange={(u) => setUnit(field.key, u)}
            metricValue={data[field.key]}
            onMetricChange={(v) => setMetricValue(field.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function MeasurementField({
  label,
  required,
  kind,
  unit,
  onUnitChange,
  metricValue,
  onMetricChange,
}: {
  label: string;
  required?: boolean;
  kind: "height" | "weight" | "length";
  unit: UnitSystem;
  onUnitChange: (unit: UnitSystem) => void;
  metricValue?: number;
  onMetricChange: (metric: number | undefined) => void;
}) {
  const inputClass =
    "min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

  if (kind === "height" && unit === "imperial") {
    const { feet, inches } =
      metricValue != null ? cmToFtIn(metricValue) : { feet: undefined, inches: undefined };

    return (
      <FieldShell label={label} required={required} unit={unit} onUnitChange={onUnitChange}>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              min={3}
              max={8}
              placeholder="ft"
              value={feet ?? ""}
              onChange={(e) => {
                const ft = e.target.value ? Number(e.target.value) : 0;
                const inVal = inches ?? 0;
                if (!e.target.value && (inches == null || inches === 0)) {
                  onMetricChange(undefined);
                } else {
                  onMetricChange(ftInToCm(ft, inVal));
                }
              }}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-forge-muted">feet</span>
          </div>
          <div className="flex-1">
            <input
              type="number"
              min={0}
              max={11.9}
              step={0.1}
              placeholder="in"
              value={inches ?? ""}
              onChange={(e) => {
                const inVal = e.target.value ? Number(e.target.value) : 0;
                const ft = feet ?? 0;
                if (!e.target.value && (feet == null || feet === 0)) {
                  onMetricChange(undefined);
                } else {
                  onMetricChange(ftInToCm(ft, inVal));
                }
              }}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-forge-muted">inches</span>
          </div>
        </div>
      </FieldShell>
    );
  }

  if (kind === "height" && unit === "metric") {
    return (
      <FieldShell label={label} required={required} unit={unit} onUnitChange={onUnitChange}>
        <input
          type="number"
          required={required}
          min={100}
          max={250}
          step={0.1}
          placeholder="cm"
          value={metricValue ?? ""}
          onChange={(e) =>
            onMetricChange(e.target.value ? Number(e.target.value) : undefined)
          }
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-forge-muted">centimeters</span>
      </FieldShell>
    );
  }

  if (kind === "weight") {
    const display =
      metricValue != null
        ? unit === "metric"
          ? metricValue
          : kgToLbs(metricValue)
        : undefined;
    const min = unit === "metric" ? 30 : 66;
    const max = unit === "metric" ? 300 : 660;
    const suffix = unit === "metric" ? "kilograms" : "pounds";

    return (
      <FieldShell label={label} required={required} unit={unit} onUnitChange={onUnitChange}>
        <input
          type="number"
          required={required}
          min={min}
          max={max}
          step={0.1}
          value={display ?? ""}
          onChange={(e) => {
            if (!e.target.value) {
              onMetricChange(undefined);
              return;
            }
            const raw = Number(e.target.value);
            onMetricChange(unit === "metric" ? raw : lbsToKg(raw));
          }}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-forge-muted">{suffix}</span>
      </FieldShell>
    );
  }

  // length (waist, chest, etc.)
  const display =
    metricValue != null
      ? unit === "metric"
        ? metricValue
        : cmToIn(metricValue)
      : undefined;
  const suffix = unit === "metric" ? "centimeters" : "inches";

  return (
    <FieldShell label={label} required={required} unit={unit} onUnitChange={onUnitChange}>
      <input
        type="number"
        min={unit === "metric" ? 1 : 1}
        max={unit === "metric" ? 250 : 100}
        step={0.1}
        value={display ?? ""}
        onChange={(e) => {
          if (!e.target.value) {
            onMetricChange(undefined);
            return;
          }
          const raw = Number(e.target.value);
          onMetricChange(unit === "metric" ? raw : inToCm(raw));
        }}
        className={inputClass}
      />
      <span className="mt-1 block text-xs text-forge-muted">{suffix}</span>
    </FieldShell>
  );
}

function FieldShell({
  label,
  required,
  unit,
  onUnitChange,
  children,
}: {
  label: string;
  required?: boolean;
  unit: UnitSystem;
  onUnitChange: (unit: UnitSystem) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm text-forge-muted">
          {label}
          {required && <span className="text-forge-ember"> *</span>}
        </label>
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as UnitSystem)}
          aria-label={`${label} unit`}
          className="min-h-[36px] rounded-lg border border-[var(--border)] bg-forge-surface-raised px-2 text-xs font-medium text-forge-text outline-none focus:border-forge-ember"
        >
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-forge-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required,
  min,
  max,
  suffix,
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  required?: boolean;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-forge-muted">
        {label}
        {required && <span className="text-forge-ember"> *</span>}
      </label>
      <input
        type="number"
        required={required}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        className="min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember"
      />
      {suffix && (
        <span className="mt-1 block text-xs text-forge-muted">{suffix}</span>
      )}
    </div>
  );
}
