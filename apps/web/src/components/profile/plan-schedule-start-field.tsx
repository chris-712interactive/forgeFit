"use client";

import { todayScheduleStartIso } from "@/lib/programs/start-date";

interface PlanScheduleStartFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export function PlanScheduleStartField({
  id = "schedule-start-date",
  value,
  onChange,
  description = "Workouts stay locked until this date.",
}: PlanScheduleStartFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-forge-muted">
        New plan starts on
      </label>
      <input
        id={id}
        type="date"
        min={todayScheduleStartIso()}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-forge-text outline-none focus:border-forge-ember"
      />
      <p className="mt-1.5 text-xs text-forge-muted">{description}</p>
    </div>
  );
}
