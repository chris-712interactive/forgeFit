/** All body measurements are stored in metric (kg, cm) in the database. */

export type UnitSystem = "metric" | "imperial";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return round1(lbs * KG_PER_LB);
}

export function kgToLbs(kg: number): number {
  return round1(kg / KG_PER_LB);
}

export function inToCm(inches: number): number {
  return round1(inches * CM_PER_IN);
}

export function cmToIn(cm: number): number {
  return round1(cm / CM_PER_IN);
}

export function ftInToCm(feet: number, inches: number): number {
  return round1((feet * 12 + inches) * CM_PER_IN);
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalIn = cm / CM_PER_IN;
  const feet = Math.floor(totalIn / 12);
  const inches = round1(totalIn - feet * 12);
  return { feet, inches };
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
