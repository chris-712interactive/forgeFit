"use client";

import {
  enterTravelMode,
  exitTravelMode,
  saveUserEquipment,
} from "@/app/actions/equipment";
import { PlanScheduleStartField } from "@/components/profile/plan-schedule-start-field";
import { readActionError } from "@/lib/auth/action-result";
import { ProfileSubSection } from "@/components/profile/profile-subsection";
import {
  CARDIO_EQUIPMENT,
  RECOVERY_EQUIPMENT,
  STRENGTH_EQUIPMENT,
} from "@/lib/constants/onboarding";
import { todayScheduleStartIso } from "@/lib/programs/start-date";
import type { UserEquipmentSettings } from "@/lib/equipment/service";
import type { EquipmentLocation } from "@/lib/types/profile";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface EquipmentSettingProps {
  initialSettings: UserEquipmentSettings;
}

const LOCATION_OPTIONS: { value: EquipmentLocation; label: string }[] = [
  { value: "gym", label: "Commercial gym" },
  { value: "home", label: "Home gym" },
  { value: "both", label: "Both" },
];

export function EquipmentSetting({ initialSettings }: EquipmentSettingProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [regenerateProgram, setRegenerateProgram] = useState(true);
  const [scheduleStartDate, setScheduleStartDate] = useState(
    todayScheduleStartIso()
  );

  const [equipment, setEquipment] = useState(initialSettings.equipment);
  const [recoveryEquipment, setRecoveryEquipment] = useState(
    initialSettings.recoveryEquipment
  );
  const [equipmentLocation, setEquipmentLocation] = useState(
    initialSettings.equipmentLocation
  );
  const [isTravelMode, setIsTravelMode] = useState(initialSettings.isTravelMode);

  useEffect(() => {
    setEquipment(initialSettings.equipment);
    setRecoveryEquipment(initialSettings.recoveryEquipment);
    setEquipmentLocation(initialSettings.equipmentLocation);
    setIsTravelMode(initialSettings.isTravelMode);
  }, [initialSettings]);

  function toggleEquipment(value: string) {
    setEquipment((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
    setSaved(false);
    setError(null);
  }

  function toggleRecovery(value: string) {
    setRecoveryEquipment((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const result = await saveUserEquipment(
        equipment,
        equipmentLocation,
        recoveryEquipment,
        regenerateProgram,
        regenerateProgram ? scheduleStartDate : undefined
      );
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleEnterTravelMode() {
    startTransition(async () => {
      setError(null);
      const result = await enterTravelMode(
        regenerateProgram,
        regenerateProgram ? scheduleStartDate : undefined
      );
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleExitTravelMode() {
    startTransition(async () => {
      setError(null);
      const result = await exitTravelMode(
        regenerateProgram,
        regenerateProgram ? scheduleStartDate : undefined
      );
      const actionError = readActionError(result);
      if (actionError) {
        setError(actionError);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 text-sm">
      {!initialSettings.travelModeReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-gold/10 px-3 py-2 text-xs text-forge-gold">
          {FEATURE_TEMPORARILY_UNAVAILABLE}
        </p>
      )}

      {isTravelMode && (
        <div className="rounded-xl border border-forge-ember/30 bg-forge-ember/10 px-3 py-3 text-forge-text">
          <p className="font-medium">Travel mode is on</p>
          <p className="mt-1 text-xs text-forge-muted">
            Your home equipment is saved. The selections below only apply while
            you are traveling.
          </p>
          <button
            type="button"
            disabled={pending || !initialSettings.travelModeReady}
            onClick={handleExitTravelMode}
            className="mt-3 min-h-[44px] rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-2 text-xs font-semibold text-forge-text disabled:opacity-50"
          >
            Back to home equipment
          </button>
        </div>
      )}

      <ProfileSubSection
        title="Training gear"
        hint={
          LOCATION_OPTIONS.find((option) => option.value === equipmentLocation)
            ?.label ?? "Location"
        }
        defaultOpen
      >
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Primary location
          </p>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={equipmentLocation === option.value}
                onClick={() => {
                  setEquipmentLocation(option.value);
                  setSaved(false);
                  setError(null);
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Strength & accessories
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STRENGTH_EQUIPMENT.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={equipment.includes(item.value)}
                onClick={() => toggleEquipment(item.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Cardio machines
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CARDIO_EQUIPMENT.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={equipment.includes(item.value)}
                onClick={() => toggleEquipment(item.value)}
              />
            ))}
          </div>
        </div>
      </ProfileSubSection>

      <ProfileSubSection
        title="Recovery tools"
        hint={
          recoveryEquipment.length === 0
            ? "None selected"
            : `${recoveryEquipment.length} selected`
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {RECOVERY_EQUIPMENT.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={recoveryEquipment.includes(item.value)}
              onClick={() => toggleRecovery(item.value)}
            />
          ))}
        </div>
      </ProfileSubSection>

      <ProfileSubSection
        title="Save options"
        hint={regenerateProgram ? "Regenerate on save" : "Save only"}
      >
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-3">
          <input
            type="checkbox"
            checked={regenerateProgram}
            onChange={(event) => setRegenerateProgram(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
          />
          <span>
            <span className="font-medium text-forge-text">
              Regenerate program with this equipment
            </span>
            <span className="mt-1 block text-xs text-forge-muted">
              Rebuilds workouts to match your current gear. Turn off to save
              equipment without changing this week&apos;s plan layout.
            </span>
          </span>
        </label>

        {regenerateProgram && (
          <PlanScheduleStartField
            id="equipment-schedule-start-date"
            value={scheduleStartDate}
            onChange={setScheduleStartDate}
            description="Used when regenerating your plan for new equipment or travel mode."
          />
        )}
      </ProfileSubSection>

      <div className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || equipment.length === 0}
            onClick={handleSave}
            className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save equipment"}
          </button>

          {!isTravelMode && initialSettings.travelModeReady && (
            <button
              type="button"
              disabled={pending}
              onClick={handleEnterTravelMode}
              className="min-h-[48px] rounded-xl border border-[var(--border)] px-4 py-2 font-semibold text-forge-text disabled:opacity-50"
            >
              I&apos;m traveling
            </button>
          )}
        </div>

        {saved && !error && (
          <p className="mt-3 text-xs text-forge-success">Equipment updated.</p>
        )}
        {error && (
          <p className="mt-3 text-xs text-forge-coral" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
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
      className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
          : "border-[var(--border)] bg-forge-surface text-forge-muted"
      }`}
    >
      {label}
    </button>
  );
}
