import { useCallback, useEffect, useRef, useState } from "react";
import { snapPrescribedWeightKg } from "@/lib/progression/load-snapping";
import {
  kgFromDisplayValue,
  kgToDisplayValue,
  type UnitSystem,
} from "@/lib/units/measurements";

export function formatStoredWorkoutWeight(
  exerciseId: string,
  weightKg: number,
  unit: UnitSystem
): string {
  const snapped = snapPrescribedWeightKg(exerciseId, weightKg, unit);
  return String(kgToDisplayValue(snapped, unit));
}

/**
 * Keeps a local text buffer while typing so load snapping and unit display
 * conversion do not rewrite the field on every keystroke.
 */
export function useWorkoutWeightInput(options: {
  exerciseId: string;
  weightKg: number | undefined;
  unit: UnitSystem;
  onCommit: (weightKg: number | undefined) => void;
}) {
  const { exerciseId, weightKg, unit, onCommit } = options;
  const focusedRef = useRef(false);
  const [text, setText] = useState(() =>
    weightKg != null ? formatStoredWorkoutWeight(exerciseId, weightKg, unit) : ""
  );

  useEffect(() => {
    if (focusedRef.current) return;
    setText(
      weightKg != null ? formatStoredWorkoutWeight(exerciseId, weightKg, unit) : ""
    );
  }, [weightKg, unit, exerciseId]);

  const handleFocus = useCallback(() => {
    focusedRef.current = true;
  }, []);

  const handleChange = useCallback(
    (rawText: string) => {
      setText(rawText);
      if (rawText === "") {
        onCommit(undefined);
        return;
      }
      const parsed = parseFloat(rawText);
      if (!Number.isNaN(parsed)) {
        onCommit(kgFromDisplayValue(parsed, unit));
      }
    },
    [onCommit, unit]
  );

  const handleBlur = useCallback(() => {
    focusedRef.current = false;
    if (text === "") {
      onCommit(undefined);
      return;
    }
    const parsed = parseFloat(text);
    if (Number.isNaN(parsed)) {
      setText(
        weightKg != null ? formatStoredWorkoutWeight(exerciseId, weightKg, unit) : ""
      );
      return;
    }
    const rawKg = kgFromDisplayValue(parsed, unit);
    const snapped = snapPrescribedWeightKg(exerciseId, rawKg, unit);
    onCommit(snapped);
    setText(formatStoredWorkoutWeight(exerciseId, snapped, unit));
  }, [text, weightKg, exerciseId, unit, onCommit]);

  return { text, handleFocus, handleChange, handleBlur };
}
