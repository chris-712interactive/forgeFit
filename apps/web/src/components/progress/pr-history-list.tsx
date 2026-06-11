"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import type { PrRecord } from "@/lib/analytics/types";

interface PrHistoryListProps {
  records: PrRecord[];
}

export function PrHistoryList({ records }: PrHistoryListProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-forge-muted">
        PR badges appear when logged sets beat your previous best on compound
        lifts.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {records.map((record) => (
        <li
          key={`${record.exerciseId}-${record.date}-${record.e1rmKg}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium text-forge-text">{record.label}</p>
            <p className="text-xs text-forge-muted">{record.date}</p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-forge-gold/20 px-2 py-0.5 text-xs font-bold text-forge-gold">
              PR
            </span>
            <p className="mt-1 text-sm font-semibold text-forge-text">
              {kgToDisplayValue(record.weightKg, unit)} {weightLabel} ×{" "}
              {record.reps}
            </p>
            <p className="text-xs text-forge-muted">
              ~{kgToDisplayValue(record.e1rmKg, unit)} {weightLabel} e1RM
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
