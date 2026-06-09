/** All body measurements are stored in metric (kg, cm) in the database. */

export type UnitSystem = "metric" | "imperial";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Precise conversions for input/storage — do not round mid-typing. */
export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_IN;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalIn = cm / CM_PER_IN;
  const feet = Math.floor(totalIn / 12);
  const inches = totalIn - feet * 12;
  return { feet, inches };
}

/** Rounded values for read-only display (profile, summaries). */
export function formatKgToLbs(kg: number): number {
  return round1(kgToLbs(kg));
}

export function formatCmToIn(cm: number): number {
  return round1(cmToIn(cm));
}

export function formatFtIn(cm: number): { feet: number; inches: number } {
  const { feet, inches } = cmToFtIn(cm);
  return { feet, inches: round1(inches) };
}

export const UNIT_SYSTEM_TILES: {
  value: UnitSystem;
  label: string;
  description: string;
}[] = [
  {
    value: "metric",
    label: "Metric (cm/kg)",
    description: "Centimeters & kilograms",
  },
  {
    value: "imperial",
    label: "Imperial (ft/in/lbs)",
    description: "Feet, inches & pounds",
  },
];
