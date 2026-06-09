"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  normalizeUnitSystem,
  type UnitSystem,
} from "@/lib/units/measurements";

const UnitPreferenceContext = createContext<{
  unit: UnitSystem;
  setUnit: (unit: UnitSystem) => void;
} | null>(null);

export function UnitPreferenceProvider({
  initialUnit,
  children,
}: {
  initialUnit: UnitSystem;
  children: ReactNode;
}) {
  const [unit, setUnit] = useState<UnitSystem>(normalizeUnitSystem(initialUnit));

  const value = useMemo(() => ({ unit, setUnit }), [unit]);

  return (
    <UnitPreferenceContext.Provider value={value}>
      {children}
    </UnitPreferenceContext.Provider>
  );
}

export function useUnitPreference(): UnitSystem {
  const context = useContext(UnitPreferenceContext);
  return context?.unit ?? "metric";
}

export function useUnitPreferenceActions():
  | { unit: UnitSystem; setUnit: (unit: UnitSystem) => void }
  | null {
  return useContext(UnitPreferenceContext);
}
