import { useEffect, useState } from "react";
import type { UnitSystem } from "@/lib/units/measurements";

/**
 * Keeps a local text buffer while typing so values are not rewritten by
 * unit round-trip conversion on every keystroke.
 */
export function useUnitInput(
  unit: UnitSystem,
  metricValue: number | undefined,
  toDisplay: (metric: number, unit: UnitSystem) => string
) {
  const [text, setText] = useState(() =>
    metricValue != null ? toDisplay(metricValue, unit) : ""
  );

  useEffect(() => {
    setText(metricValue != null ? toDisplay(metricValue, unit) : "");
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps -- only reset display when unit tile changes

  return { text, setText };
}
