"use client";

import { useEffect, useState } from "react";
import type { OnboardingData, SexType } from "@/lib/types/profile";
import { useUnitInput } from "@/components/onboarding/use-unit-input";
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
  const [ftText, setFtText] = useState("");
  const [inText, setInText] = useState("");
  const { text, setText } = useUnitInput(unit, metricValue, (m) => String(m));

  useEffect(() => {
    if (unit !== "imperial") return;
    if (metricValue != null) {
      const { feet, inches } = cmToFtIn(metricValue);
      setFtText(feet > 0 ? String(feet) : "");
      setInText(inches > 0 ? String(inches) : "");
    } else {
      setFtText("");
      setInText("");
    }
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  function syncHeightFromImperial(ft: string, inches: string) {
    if (!ft && !inches) {
      onMetricChange(undefined);
      return;
    }
    const feet = ft ? parseFloat(ft) : 0;
    const inch = inches ? parseFloat(inches) : 0;
    if (Number.isNaN(feet) || Number.isNaN(inch)) return;
    onMetricChange(ftInToCm(feet, inch));
  }

  if (unit === "imperial") {
    return (
      <div>
        <FieldLabel label="Height" required={required} />
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              inputMode="numeric"
              placeholder="ft"
              value={ftText}
              onChange={(e) => {
                setFtText(e.target.value);
                syncHeightFromImperial(e.target.value, inText);
              }}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-forge-muted">feet</span>
          </div>
          <div className="flex-1">
            <input
              type="text"
              inputMode="decimal"
              placeholder="in"
              value={inText}
              onChange={(e) => {
                setInText(e.target.value);
                syncHeightFromImperial(ftText, e.target.value);
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
        type="text"
        inputMode="decimal"
        required={required}
        placeholder="cm"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parseFloat(e.target.value);
          if (!e.target.value) onMetricChange(undefined);
          else if (!Number.isNaN(parsed)) onMetricChange(parsed);
        }}
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
  const { text, setText } = useUnitInput(unit, metricValue, (m, u) =>
    u === "metric" ? String(m) : String(kgToLbs(m))
  );

  return (
    <div>
      <FieldLabel label="Weight" required={required} />
      <input
        type="text"
        inputMode="decimal"
        required={required}
        placeholder={isMetric ? "kg" : "lbs"}
        value={text}
        onChange={(e) => {
          const val = e.target.value;
          setText(val);
          if (!val) {
            onMetricChange(undefined);
            return;
          }
          const parsed = parseFloat(val);
          if (!Number.isNaN(parsed)) {
            onMetricChange(isMetric ? parsed : lbsToKg(parsed));
          }
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
  const { text, setText } = useUnitInput(unit, metricValue, (m, u) =>
    u === "metric" ? String(m) : String(cmToIn(m))
  );

  return (
    <div>
      <FieldLabel label={label} />
      <input
        type="text"
        inputMode="decimal"
        placeholder={isMetric ? "cm" : "in"}
        value={text}
        onChange={(e) => {
          const val = e.target.value;
          setText(val);
          if (!val) {
            onMetricChange(undefined);
            return;
          }
          const parsed = parseFloat(val);
          if (!Number.isNaN(parsed)) {
            onMetricChange(isMetric ? parsed : inToCm(parsed));
          }
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
