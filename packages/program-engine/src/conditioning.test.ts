import assert from "node:assert/strict";
import test from "node:test";
import { buildConditioningBlock } from "./conditioning";
import type { ProgramUserProfile } from "./types";

const baseProfile: ProgramUserProfile = {
  goal: "functional_conditioning",
  experience: "intermediate",
  sessionsPerWeek: 4,
  minutesPerSession: 45,
  weightKg: 75,
  heightCm: 178,
  age: 28,
  sex: "male",
  equipment: ["barbell", "dumbbells", "bench", "squat_rack", "cables", "machines", "kettlebells"],
  recoveryEquipment: [],
};

test("buildConditioningBlock returns fixed rounds with movements", () => {
  const block = buildConditioningBlock(
    "Conditioning circuit",
    ["squat", "horizontal_push", "hinge", "core"],
    baseProfile,
    []
  );
  assert.equal(block.format, "fixed_rounds");
  assert.ok(block.rounds >= 3);
  assert.ok(block.movements.length >= 3);
  assert.ok(block.movements.every((movement) => movement.prescription.length > 0));
});
