"use client";

import {
  updatePlanSettings,
} from "@/app/actions/program";
import { PlanScheduleStartField } from "@/components/profile/plan-schedule-start-field";
import { readActionError } from "@/lib/auth/action-result";
import { RebuildPlanModal } from "@/components/profile/rebuild-plan-modal";
import { ProfileSubSection } from "@/components/profile/profile-subsection";
import { SportPlanFields } from "@/components/profile/sport-plan-fields";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { getSportById } from "@forgefit/evidence-kb";
import {
  FAT_LOSS_PACE_OPTIONS,
  FITNESS_GOALS,
  MINUTES_PER_SESSION_OPTIONS,
  RECOMP_PRIORITY_OPTIONS,
  SESSIONS_PER_WEEK_OPTIONS,
  SPORT_PERFORMANCE_GOAL,
} from "@/lib/constants/onboarding";
import { todayScheduleStartIso } from "@/lib/programs/start-date";
import type {
  FatLossPace,
  FitnessGoal,
  RecompPriority,
  SportPracticeGymPolicy,
  SportSeasonPhase,
} from "@/lib/types/profile";
import {
  formatWeight,
  kgFromDisplayValue,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { DAY_LABELS } from "@forgefit/program-engine";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

interface ProgramPlanSettingProps {
  userId: string;
  initialGoal: FitnessGoal | null;
  initialFatLossPace: FatLossPace | null;
  initialRecompPriority: RecompPriority | null;
  initialGoalWeightKg: number | null;
  initialCurrentWeightKg: number | null;
  initialSessionsPerWeek: number | null;
  initialMinutesPerSession: number | null;
  initialSportId?: string | null;
  initialSportPositionId?: string | null;
  initialSportSeasonPhase?: SportSeasonPhase | null;
  initialSportPracticeDays?: number[] | null;
  initialSportPracticeGymPolicy?: SportPracticeGymPolicy | null;
  initialSportPracticeScheduleVaries?: boolean;
  initialSecondaryGoal?: FitnessGoal | null;
}

export function ProgramPlanSetting({
  userId,
  initialGoal,
  initialFatLossPace,
  initialRecompPriority,
  initialGoalWeightKg,
  initialCurrentWeightKg,
  initialSessionsPerWeek,
  initialMinutesPerSession,
  initialSportId,
  initialSportPositionId,
  initialSportSeasonPhase,
  initialSportPracticeDays,
  initialSportPracticeGymPolicy,
  initialSportPracticeScheduleVaries,
  initialSecondaryGoal,
}: ProgramPlanSettingProps) {
  const router = useRouter();
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<string[] | null>(null);
  const [isDeloadWeek, setIsDeloadWeek] = useState(false);

  const [goal, setGoal] = useState<FitnessGoal>(
    initialGoal ?? "general_strength"
  );
  const [fatLossPace, setFatLossPace] = useState<FatLossPace>(
    initialFatLossPace ?? "moderate"
  );
  const [recompPriority, setRecompPriority] = useState<RecompPriority>(
    initialRecompPriority ?? "balanced"
  );
  const [goalWeightKg, setGoalWeightKg] = useState<number | null>(
    initialGoalWeightKg
  );
  const [sessionsPerWeek, setSessionsPerWeek] = useState(
    initialSessionsPerWeek ?? 3
  );
  const [minutesPerSession, setMinutesPerSession] = useState(
    initialMinutesPerSession ?? 45
  );
  const [regenerateOnSave, setRegenerateOnSave] = useState(true);
  const [scheduleStartDate, setScheduleStartDate] = useState(
    todayScheduleStartIso()
  );
  const [showRebuildModal, setShowRebuildModal] = useState(false);

  const initialSport = getSportById(initialSportId ?? undefined);
  const [sportCategoryId, setSportCategoryId] = useState(
    initialSport?.categoryId ?? ""
  );
  const [sportId, setSportId] = useState(initialSportId ?? "");
  const [sportPositionId, setSportPositionId] = useState(
    initialSportPositionId ?? ""
  );
  const [sportSeasonPhase, setSportSeasonPhase] = useState<SportSeasonPhase>(
    initialSportSeasonPhase ?? "general_prep"
  );
  const [sportPracticeDays, setSportPracticeDays] = useState<number[]>(
    initialSportPracticeDays ?? []
  );
  const [sportPracticeGymPolicy, setSportPracticeGymPolicy] = useState<
    SportPracticeGymPolicy | ""
  >(initialSportPracticeGymPolicy ?? "");
  const [sportPracticeScheduleVaries, setSportPracticeScheduleVaries] =
    useState(initialSportPracticeScheduleVaries ?? false);
  const [secondaryGoal, setSecondaryGoal] = useState<FitnessGoal | "">(
    initialSecondaryGoal ?? ""
  );

  const isSport = goal === "sport_performance";
  const showFatLossPace =
    goal === "fat_loss" || (isSport && secondaryGoal === "fat_loss");
  const showRecompPriority =
    goal === "recomposition" || (isSport && secondaryGoal === "recomposition");
  const showBodyComposition = showFatLossPace || showRecompPriority;
  const goalWeightInvalid =
    goalWeightKg != null &&
    initialCurrentWeightKg != null &&
    goalWeightKg >= initialCurrentWeightKg;

  const goalScheduleHint = `${sessionsPerWeek}×${minutesPerSession} min`;
  const sportHint = useMemo(() => {
    const sport = getSportById(sportId || undefined);
    if (!sport) return "Select sport";
    return sport.label;
  }, [sportId]);
  const practiceHint = useMemo(() => {
    if (sportPracticeScheduleVaries) return "Varies weekly";
    if (sportPracticeDays.length === 0) return "No days set";
    return sportPracticeDays.map((day) => DAY_LABELS[day]).join(", ");
  }, [sportPracticeDays, sportPracticeScheduleVaries]);
  const bodyHint =
    goalWeightKg != null
      ? formatWeight(goalWeightKg, unit)
      : "No target weight";
  const rebuildHint = regenerateOnSave ? "Regenerate on save" : "Save only";

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

      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }

      if (result.changes?.length) {
        setChanges(result.changes);
        setIsDeloadWeek(Boolean(result.isDeloadWeek));
      }

      router.refresh();
    });
  }

  function saveSettings() {
    if (goalWeightInvalid) {
      setError(
        initialCurrentWeightKg != null
          ? `Goal weight must be below your current weight (${formatWeight(initialCurrentWeightKg, unit)}).`
          : "Goal weight must be below your current weight."
      );
      return;
    }

    runAction(() =>
      updatePlanSettings({
        primary_goal: goal,
        sport_id: isSport ? sportId : undefined,
        sport_position_id: isSport ? sportPositionId || undefined : undefined,
        sport_season_phase: isSport ? sportSeasonPhase : undefined,
        sport_practice_days: isSport ? sportPracticeDays : undefined,
        sport_practice_gym_policy:
          isSport && sportPracticeGymPolicy ? sportPracticeGymPolicy : undefined,
        sport_practice_schedule_varies: isSport
          ? sportPracticeScheduleVaries
          : undefined,
        secondary_goal: isSport && secondaryGoal ? secondaryGoal : undefined,
        fat_loss_pace: showFatLossPace ? fatLossPace : undefined,
        recomp_priority: showRecompPriority ? recompPriority : undefined,
        goal_weight_kg: showBodyComposition ? goalWeightKg : null,
        sessions_per_week: sessionsPerWeek,
        minutes_per_session: minutesPerSession,
        regenerate_program: regenerateOnSave,
        schedule_start_date: scheduleStartDate,
      })
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-forge-muted">
        Expand a section to edit. Goal and weekly time budget stay open by
        default.
      </p>

      <ProfileSubSection title="Goal & weekly time" hint={goalScheduleHint} defaultOpen>
        <div>
          <label className="mb-1.5 block text-sm text-forge-muted">Goal</label>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value as FitnessGoal)}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember"
          >
            <option value={SPORT_PERFORMANCE_GOAL.value}>
              {SPORT_PERFORMANCE_GOAL.label}
            </option>
            {FITNESS_GOALS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {showFatLossPace && (
          <div>
            <p className="mb-2 text-sm text-forge-muted">Fat-loss pace</p>
            <div className="space-y-2">
              {FAT_LOSS_PACE_OPTIONS.map((option) => (
                <ChipButton
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  selected={fatLossPace === option.value}
                  onClick={() => setFatLossPace(option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {showRecompPriority && (
          <div>
            <p className="mb-2 text-sm text-forge-muted">Recomp priority</p>
            <div className="space-y-2">
              {RECOMP_PRIORITY_OPTIONS.map((option) => (
                <ChipButton
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  selected={recompPriority === option.value}
                  onClick={() => setRecompPriority(option.value)}
                />
              ))}
            </div>
          </div>
        )}

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
      </ProfileSubSection>

      {isSport ? (
        <>
          <ProfileSubSection title="Sport profile" hint={sportHint}>
            <SportPlanFields
              sportCategoryId={sportCategoryId}
              sportId={sportId}
              sportPositionId={sportPositionId}
              sportSeasonPhase={sportSeasonPhase}
              sportPracticeDays={sportPracticeDays}
              sportPracticeGymPolicy={sportPracticeGymPolicy}
              sportPracticeScheduleVaries={sportPracticeScheduleVaries}
              secondaryGoal={secondaryGoal}
              onSportCategoryChange={setSportCategoryId}
              onSportIdChange={setSportId}
              onSportPositionChange={setSportPositionId}
              onSeasonPhaseChange={setSportSeasonPhase}
              onSportPracticeDaysChange={setSportPracticeDays}
              onSportPracticeGymPolicyChange={setSportPracticeGymPolicy}
              onSportPracticeScheduleVariesChange={
                setSportPracticeScheduleVaries
              }
              onSecondaryGoalChange={setSecondaryGoal}
              sections="identity"
            />
          </ProfileSubSection>

          <ProfileSubSection title="Practice schedule" hint={practiceHint}>
            <SportPlanFields
              sportCategoryId={sportCategoryId}
              sportId={sportId}
              sportPositionId={sportPositionId}
              sportSeasonPhase={sportSeasonPhase}
              sportPracticeDays={sportPracticeDays}
              sportPracticeGymPolicy={sportPracticeGymPolicy}
              sportPracticeScheduleVaries={sportPracticeScheduleVaries}
              secondaryGoal={secondaryGoal}
              onSportCategoryChange={setSportCategoryId}
              onSportIdChange={setSportId}
              onSportPositionChange={setSportPositionId}
              onSeasonPhaseChange={setSportSeasonPhase}
              onSportPracticeDaysChange={setSportPracticeDays}
              onSportPracticeGymPolicyChange={setSportPracticeGymPolicy}
              onSportPracticeScheduleVariesChange={
                setSportPracticeScheduleVaries
              }
              onSecondaryGoalChange={setSecondaryGoal}
              sections="practice"
            />
          </ProfileSubSection>
        </>
      ) : null}

      {showBodyComposition ? (
        <ProfileSubSection title="Body composition" hint={bodyHint}>
          <div>
            <label className="mb-1.5 block text-sm text-forge-muted">
              Goal weight (optional, {weightLabel})
            </label>
            <input
              type="number"
              min={unit === "metric" ? 30 : 66}
              max={unit === "metric" ? 300 : 661}
              step={unit === "metric" ? 0.1 : 0.5}
              value={
                goalWeightKg != null ? kgToDisplayValue(goalWeightKg, unit) : ""
              }
              onChange={(event) => {
                const raw = event.target.value;
                if (!raw) {
                  setGoalWeightKg(null);
                  return;
                }
                const parsed = Number(raw);
                if (!Number.isFinite(parsed)) return;
                setGoalWeightKg(kgFromDisplayValue(parsed, unit));
              }}
              placeholder={`For Pro goal-date forecasts (${weightLabel})`}
              className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember"
            />
            {goalWeightInvalid && initialCurrentWeightKg != null && (
              <p className="mt-2 text-sm text-forge-coral" role="alert">
                Goal weight must be below your current weight (
                {formatWeight(initialCurrentWeightKg, unit)}).
              </p>
            )}
          </div>
        </ProfileSubSection>
      ) : null}

      <ProfileSubSection title="Rebuild options" hint={rebuildHint}>
        <PlanScheduleStartField
          value={scheduleStartDate}
          onChange={setScheduleStartDate}
          description="Used when you rebuild or save with regeneration. Workouts stay locked until this date."
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3">
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
      </ProfileSubSection>

      <div className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={pending}
            onClick={saveSettings}
            className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save plan settings"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowRebuildModal(true)}
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
      </div>

      {showRebuildModal && (
        <RebuildPlanModal
          userId={userId}
          onClose={() => setShowRebuildModal(false)}
          onComplete={(result) => {
            const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
              return;
            }
            setError(null);
            if (result.changes?.length) {
              setChanges(result.changes);
              setIsDeloadWeek(Boolean(result.isDeloadWeek));
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ChipButton({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
        selected
          ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
          : "border-[var(--border)] bg-forge-surface-raised text-forge-muted"
      }`}
    >
      <span>{label}</span>
      {description && (
        <span className="mt-0.5 block text-xs font-normal opacity-90">
          {description}
        </span>
      )}
    </button>
  );
}
