"use client";

import { useState } from "react";
import type { OnboardingData, SexType } from "@/lib/types/profile";
import {
  UNIT_SYSTEM_TILES,
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

const OPTIONAL_FIELDS: {
  key: MeasurementKey;
  label: string;
}[] = [
  { key: "waist_cm", label: "Waist" },
  { key: "chest_cm", label: "Chest" },
  { key: "arms_cm", label: "Arms" },
  { key: "legs_cm", label: "Legs" },
  { key: "neck_cm", label: "Neck" },
  { key: "hips_cm", label: "Hips" },
];

const inputClass =
  "min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

interface MeasurementStepProps {
  data: Partial<OnboardingData>;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function MeasurementStep({ data, onChange }: MeasurementStepProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

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

      <div>
        <p className="mb-2 text-sm font-medium text-forge-text">Unit system</p>
        <div className="grid grid-cols-2 gap-3">
          {UNIT_SYSTEM_TILES.map((tile) => (
            <button
              key={tile.value}
              type="button"
              onClick={() => setUnitSystem(tile.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                unitSystem === tile.value
                  ? "border-forge-ember bg-forge-ember/10"
                  : "border-[var(--border)] bg-forge-surface-raised"
              }`}
            >
              <p className="font-display text-sm font-semibold text-forge-text">
                {tile.label}
              </p>
              <p className="mt-1 text-xs text-forge-muted">{tile.description}</p>
            </button>
          ))}
        </div>
      </div>

      <HeightField
        required
        unit={unitSystem}
        metricValue={data.height_cm}
        onMetricChange={(v) => setMetricValue("height_cm", v)}
      />

      <WeightField
        required
        unit={unitSystem}
        metricValue={data.weight_kg}
        onMetricChange={(v) => setMetricValue("weight_kg", v)}
      />

      <p className="text-sm text-forge-muted">Optional measurements</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONAL_FIELDS.map((field) => (
          <LengthField
            key={field.key}
            label={field.label}
            unit={unitSystem}
            metricValue={data[field.key]}
            onMetricChange={(v) => setMetricValue(field.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-sm text-forge-muted">
      {label}
      {required && <span className="text-forge-ember"> *</span>}
    </label>
  );
}

function HeightField({
  required,
  unit,
  metricValue,
  onMetricChange,
}: {
  required?: boolean;
  unit: UnitSystem;
  metricValue?: number;
  onMetricChange: (metric: number | undefined) => void;
}) {
  if (unit === "imperial") {
    const { feet, inches } =
      metricValue != null
        ? cmToFtIn(metricValue)
        : { feet: undefined, inches: undefined };

    return (
      <div>
        <FieldLabel label="Height" required={required} />
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
      </div>
    );
  }

  return (
    <div>
      <FieldLabel label="Height" required={required} />
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
    </div>
  );
}

function WeightField({
  required,
  unit,
  metricValue,
  onMetricChange,
}: {
  required?: boolean;
  unit: UnitSystem;
  metricValue?: number;
  onMetricChange: (metric: number | undefined) => void;
}) {
  const isMetric = unit === "metric";
  const display =
    metricValue != null
      ? isMetric
        ? metricValue
        : kgToLbs(metricValue)
      : undefined;

  return (
    <div>
      <FieldLabel label="Weight" required={required} />
      <input
        type="number"
        required={required}
        min={isMetric ? 30 : 66}
        max={isMetric ? 300 : 660}
        step={0.1}
        placeholder={isMetric ? "kg" : "lbs"}
        value={display ?? ""}
        onChange={(e) => {
          if (!e.target.value) {
            onMetricChange(undefined);
            return;
          }
          const raw = Number(e.target.value);
          onMetricChange(isMetric ? raw : lbsToKg(raw));
        }}
        className={inputClass}
      />
      <span className="mt-1 block text-xs text-forge-muted">
        {isMetric ? "kilograms" : "pounds"}
      </span>
    </div>
  );
}

function LengthField({
  label,
  unit,
  metricValue,
  onMetricChange,
}: {
  label: string;
  unit: UnitSystem;
  metricValue?: number;
  onMetricChange: (metric: number | undefined) => void;
}) {
  const isMetric = unit === "metric";
  const display =
    metricValue != null
      ? isMetric
        ? metricValue
        : cmToIn(metricValue)
      : undefined;

  return (
    <div>
      <FieldLabel label={label} />
      <input
        type="number"
        min={1}
        max={isMetric ? 250 : 100}
        step={0.1}
        placeholder={isMetric ? "cm" : "in"}
        value={display ?? ""}
        onChange={(e) => {
          if (!e.target.value) {
            onMetricChange(undefined);
            return;
          }
          const raw = Number(e.target.value);
          onMetricChange(isMetric ? raw : inToCm(raw));
        }}
        className={inputClass}
      />
      <span className="mt-1 block text-xs text-forge-muted">
        {isMetric ? "centimeters" : "inches"}
      </span>
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
        className={inputClass}
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
      <FieldLabel label={label} required={required} />
      <input
        type="number"
        required={required}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        className={inputClass}
      />
      {suffix && (
        <span className="mt-1 block text-xs text-forge-muted">{suffix}</span>
      )}
    </div>
  );
}
