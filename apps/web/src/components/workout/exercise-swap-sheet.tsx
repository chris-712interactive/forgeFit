"use client";

import {
  buildSubstitutionReason,
  exerciseImageUrl,
  getSubstitutions,
  resolveExerciseDetail,
  suggestBusyEquipment,
  type CatalogExercise,
} from "@forgefit/exercise-db";
import {
  swapExerciseInSession,
  type SubstitutionReason,
} from "@forgefit/offline-sync";
import { formatEquipment } from "@/lib/exercises/labels";
import { useEffect, useMemo, useState } from "react";

interface ExerciseSwapSheetProps {
  open: boolean;
  sessionClientId: string;
  exerciseIndex: number;
  exerciseId: string;
  exerciseName: string;
  userEquipment: string[];
  onClose: () => void;
  onSwapped: (input: {
    exerciseId: string;
    exerciseName: string;
    reason: SubstitutionReason;
  }) => void;
}

export function ExerciseSwapSheet({
  open,
  sessionClientId,
  exerciseIndex,
  exerciseId,
  exerciseName,
  userEquipment,
  onClose,
  onSwapped,
}: ExerciseSwapSheetProps) {
  const exercise = useMemo(
    () => resolveExerciseDetail(exerciseId),
    [exerciseId]
  );
  const selectableEquipment = useMemo(
    () =>
      (exercise?.equipment ?? []).filter((item) => item !== "bodyweight_only"),
    [exercise]
  );
  const [busyEquipment, setBusyEquipment] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !exercise) return;
    setBusyEquipment(suggestBusyEquipment(exercise));
    setError(null);
    setSubmitting(false);
  }, [open, exercise]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const substitutions = useMemo(() => {
    if (!exercise) return [];
    return getSubstitutions(exerciseId, userEquipment, 6, {
      excludeEquipment: busyEquipment,
    });
  }, [busyEquipment, exercise, exerciseId, userEquipment]);

  if (!open || !exercise) return null;

  function toggleBusyEquipment(item: string) {
    setBusyEquipment((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  async function handleSelectSwap(
    substitute: CatalogExercise,
    reason: SubstitutionReason = "equipment_busy"
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await swapExerciseInSession({
        sessionClientId,
        exerciseIndex,
        newExerciseId: substitute.id,
        newExerciseName: substitute.name,
        reason,
      });
      if (!updated) {
        setError("Could not swap exercise. Try again.");
        setSubmitting(false);
        return;
      }
      onSwapped({
        exerciseId: substitute.id,
        exerciseName: substitute.name,
        reason,
      });
      onClose();
    } catch {
      setError("Could not swap exercise on this device.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Pick a swap"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-forge-surface-raised shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-forge-muted/40" />
        </div>

        <div className="overflow-y-auto px-5 pb-4 pt-3">
          <h2 className="font-display text-xl font-bold text-forge-text">
            Pick a swap
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Same muscles. Different setup.
          </p>

          <div className="mt-4 rounded-xl border border-forge-gold/20 bg-forge-gold/5 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-forge-gold">
              Planned
            </p>
            <p className="mt-0.5 text-sm font-medium text-forge-text line-through decoration-forge-muted/60">
              {exerciseName}
            </p>
          </div>

          {selectableEquipment.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-forge-muted">
                What&apos;s taken?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectableEquipment.map((item) => {
                  const active = busyEquipment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleBusyEquipment(item)}
                      className={`min-h-[40px] rounded-full px-3 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-forge-gold/20 text-forge-gold ring-1 ring-forge-gold/40"
                          : "border border-[var(--border)] bg-forge-surface text-forge-muted"
                      }`}
                    >
                      {formatEquipment(item)}
                      {active ? " · busy" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {substitutions.map((substitute, index) => (
              <li key={substitute.id}>
                <SwapCard
                  substitute={substitute}
                  original={exercise}
                  busyEquipment={busyEquipment}
                  bestMatch={index === 0}
                  disabled={submitting}
                  onSelect={() => void handleSelectSwap(substitute)}
                />
              </li>
            ))}
          </ul>

          {substitutions.length === 0 && (
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3 text-sm text-forge-muted">
              No swaps match your setup with that equipment marked busy. Try
              unselecting a chip or keep the original exercise.
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] font-medium text-forge-muted"
          >
            Keep {exerciseName}
          </button>
        </div>
      </div>
    </div>
  );
}

function SwapCard({
  substitute,
  original,
  busyEquipment,
  bestMatch,
  disabled,
  onSelect,
}: {
  substitute: CatalogExercise;
  original: CatalogExercise;
  busyEquipment: string[];
  bestMatch: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const reason = buildSubstitutionReason(original, substitute, busyEquipment);
  const thumb = substitute.imagePaths[0];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3 text-left transition-colors hover:border-forge-ember/50 disabled:opacity-60"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-forge-surface-raised">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- cached exercise demo frame
          <img
            src={exerciseImageUrl(thumb)}
            alt=""
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-forge-muted">
            Demo
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-forge-text">{substitute.name}</p>
          {bestMatch && (
            <span className="shrink-0 rounded-full bg-forge-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forge-gold">
              Best match
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-forge-muted">{reason}</p>
        <p className="mt-1 text-[11px] text-forge-muted">
          {substitute.equipment.map(formatEquipment).join(" · ")}
        </p>
      </div>
    </button>
  );
}
