"use client";

import {
  rebuildProgram,
  updatePlanSettings,
} from "@/app/actions/program";
import {
  FITNESS_GOALS,
  MINUTES_PER_SESSION_OPTIONS,
  SESSIONS_PER_WEEK_OPTIONS,
} from "@/lib/constants/onboarding";
import type { FitnessGoal } from "@/lib/types/profile";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ProgramPlanSettingProps {
  initialGoal: FitnessGoal | null;
  initialSessionsPerWeek: number | null;
  initialMinutesPerSession: number | null;
}

export function ProgramPlanSetting({
  initialGoal,
  initialSessionsPerWeek,
  initialMinutesPerSession,
}: ProgramPlanSettingProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<string[] | null>(null);
  const [isDeloadWeek, setIsDeloadWeek] = useState(false);

  const [goal, setGoal] = useState<FitnessGoal>(
    initialGoal ?? "general_strength"
  );
  const [sessionsPerWeek, setSessionsPerWeek] = useState(
    initialSessionsPerWeek ?? 3
  );
  const [minutesPerSession, setMinutesPerSession] = useState(
    initialMinutesPerSession ?? 45
  );
  const [regenerateOnSave, setRegenerateOnSave] = useState(true);

  function runAction(action: () => Promise<unknown>) {
    startTransition(async () => {
      setError(null);
      setChanges(null);
      setIsDeloadWeek(false);

      const result = (await action()) as {
        error?: string;
        changes?: string[];
        isDeloadWeek?: boolean;
      };

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.changes?.length) {
        setChanges(result.changes);
        setIsDeloadWeek(Boolean(result.isDeloadWeek));
      }

      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <h2 className="font-display text-lg font-semibold text-forge-text">
        Program plan
      </h2>
      <p className="mt-1 text-sm text-forge-muted">
        Update your goal and schedule, or rebuild your plan with the latest
        engine and evidence rules.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-forge-muted">Goal</label>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value as FitnessGoal)}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-forge-text outline-none focus:border-forge-ember"
          >
            {FITNESS_GOALS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm text-forge-muted">Sessions per week</p>
          <div className="flex flex-wrap gap-2">
            {SESSIONS_PER_WEEK_OPTIONS.map((value) => (
              <ChipButton
                key={value}
                label={`${value}×`}
                selected={sessionsPerWeek === value}
                onClick={() => setSessionsPerWeek(value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-forge-muted">Minutes per session</p>
          <div className="flex flex-wrap gap-2">
            {MINUTES_PER_SESSION_OPTIONS.map((value) => (
              <ChipButton
                key={value}
                label={`${value} min`}
                selected={minutesPerSession === value}
                onClick={() => setMinutesPerSession(value)}
              />
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface p-3">
          <input
            type="checkbox"
            checked={regenerateOnSave}
            onChange={(event) => setRegenerateOnSave(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-forge-ember"
          />
          <span className="text-sm text-forge-muted">
            Regenerate program when saving changes (updates workouts, macros,
            and projections)
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            runAction(() =>
              updatePlanSettings({
                primary_goal: goal,
                sessions_per_week: sessionsPerWeek,
                minutes_per_session: minutesPerSession,
                regenerate_program: regenerateOnSave,
              })
            )
          }
          className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save plan settings"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runAction(() => rebuildProgram())}
          className="min-h-[48px] flex-1 rounded-xl border border-forge-ember/40 px-4 text-sm font-semibold text-forge-ember disabled:opacity-50"
        >
          Rebuild plan
        </button>
      </div>

      {changes && (
        <div className="mt-4 rounded-xl border border-forge-success/30 bg-forge-success/5 p-3">
          <p className="text-sm font-semibold text-forge-success">
            {isDeloadWeek ? "Deload plan generated" : "Plan updated"}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-forge-muted">
            {changes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
          : "border-[var(--border)] bg-forge-surface text-forge-muted"
      }`}
    >
      {label}
    </button>
  );
}
