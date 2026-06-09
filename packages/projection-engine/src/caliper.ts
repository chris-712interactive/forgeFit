import type {
  CaliperFormula,
  CaliperResult,
  CaliperSex,
  CaliperSkinfoldsMm,
} from "./types";

function siriBodyFatPct(bodyDensity: number): number {
  return (495 / bodyDensity - 450);
}

function jp3Men(sum: number, age: number): number {
  return (
    1.10938 -
    0.0008267 * sum +
    0.0000016 * sum * sum -
    0.0002574 * age
  );
}

function jp3Women(sum: number, age: number): number {
  return (
    1.0994921 -
    0.0009929 * sum +
    0.0000023 * sum * sum -
    0.0001392 * age
  );
}

function jp7Men(sum: number, age: number): number {
  return (
    1.112 -
    0.00043499 * sum +
    0.00000055 * sum * sum -
    0.00028826 * age
  );
}

function jp7Women(sum: number, age: number): number {
  return (
    1.097 -
    0.00046971 * sum +
    0.00000056 * sum * sum -
    0.00012828 * age
  );
}

function requiredSites(
  formula: CaliperFormula,
  sex: CaliperSex
): (keyof CaliperSkinfoldsMm)[] {
  if (formula === "jp7") {
    return [
      "chest",
      "midaxillary",
      "tricep",
      "subscapular",
      "abdominal",
      "suprailiac",
      "thigh",
    ];
  }

  return sex === "female"
    ? ["tricep", "suprailiac", "thigh"]
    : ["chest", "abdominal", "thigh"];
}

export function calculateJacksonPollock(
  formula: CaliperFormula,
  sex: CaliperSex,
  age: number,
  skinfolds: CaliperSkinfoldsMm
): CaliperResult {
  const sites = requiredSites(formula, sex);
  const values: number[] = [];

  for (const site of sites) {
    const value = skinfolds[site];
    if (value == null || value < 0) {
      throw new Error(`Missing skinfolds for ${formula.toUpperCase()} (${sex})`);
    }
    values.push(value);
  }

  const sumMm = values.reduce((total, value) => total + value, 0);

  let bodyDensity: number;
  if (formula === "jp7") {
    bodyDensity = sex === "female" ? jp7Women(sumMm, age) : jp7Men(sumMm, age);
  } else {
    bodyDensity = sex === "female" ? jp3Women(sumMm, age) : jp3Men(sumMm, age);
  }

  const bodyFatPct = Math.round(siriBodyFatPct(bodyDensity) * 10) / 10;

  return {
    formula,
    sumMm: Math.round(sumMm * 10) / 10,
    bodyFatPct,
    bodyDensity: Math.round(bodyDensity * 10000) / 10000,
  };
}
