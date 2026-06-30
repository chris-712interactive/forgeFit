import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  capExperienceForAge,
  isFatLossPaceAllowedForAge,
  isPrimaryGoalAllowedForAge,
  isSecondaryGoalAllowedForAge,
  maxMinutesPerSessionForAge,
  maxSessionsPerWeekForAge,
  requiresParentConsent,
  resolveAgeBand,
  resolveAgeCohort,
} from "./age-policy";

describe("age-policy", () => {
  it("resolves age bands", () => {
    assert.equal(resolveAgeBand(13), "youth_13_15");
    assert.equal(resolveAgeBand(16), "teen_16_17");
    assert.equal(resolveAgeBand(18), "young_adult_18_22");
    assert.equal(resolveAgeBand(30), "adult_23_plus");
  });

  it("resolves community cohort", () => {
    assert.equal(resolveAgeCohort(17), "teen");
    assert.equal(resolveAgeCohort(18), "adult");
  });

  it("requires parent consent for 13-15 only", () => {
    assert.equal(requiresParentConsent(13), true);
    assert.equal(requiresParentConsent(15), true);
    assert.equal(requiresParentConsent(16), false);
  });

  it("gates primary goals by age", () => {
    assert.equal(isPrimaryGoalAllowedForAge("sport_performance", 13), true);
    assert.equal(isPrimaryGoalAllowedForAge("powerlifting", 15), false);
    assert.equal(isPrimaryGoalAllowedForAge("powerlifting", 16), true);
    assert.equal(isPrimaryGoalAllowedForAge("bodybuilding", 14), false);
    assert.equal(isPrimaryGoalAllowedForAge("bodybuilding", 15), true);
  });

  it("blocks sport as secondary goal", () => {
    assert.equal(isSecondaryGoalAllowedForAge("sport_performance", 20), false);
    assert.equal(isSecondaryGoalAllowedForAge("fat_loss", 13), true);
  });

  it("gates fat loss pace", () => {
    assert.equal(isFatLossPaceAllowedForAge("steady", 13), true);
    assert.equal(isFatLossPaceAllowedForAge("moderate", 15), false);
    assert.equal(isFatLossPaceAllowedForAge("aggressive", 17), false);
    assert.equal(isFatLossPaceAllowedForAge("aggressive", 18), true);
  });

  it("caps advanced experience under 16", () => {
    assert.equal(capExperienceForAge("advanced", 15), "intermediate");
    assert.equal(capExperienceForAge("advanced", 16), "advanced");
  });

  it("caps time budget for youth", () => {
    assert.equal(maxSessionsPerWeekForAge(14), 4);
    assert.equal(maxMinutesPerSessionForAge(14), 60);
    assert.equal(maxSessionsPerWeekForAge(25), 6);
  });
});
