import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConditioningBlock,
  buildConditioningFinisherBlock,
  shouldAttachConditioningFinisher,
  shouldUseAmrapFormat,
} from "./conditioning";
import { generateProgram } from "./generate";
import { getWeeklySplit } from "./splits";
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
  equipment: [
    "barbell",
    "dumbbells",
    "bench",
    "squat_rack",
    "cables",
    "machines",
    "kettlebells",
  ],
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
  assert.equal(block.scope, "circuit");
  assert.ok(block.rounds >= 3);
  assert.ok(block.movements.length >= 3);
  assert.ok(block.movements.every((movement) => movement.prescription.length > 0));
});

test("buildConditioningBlock supports AMRAP format", () => {
  const block = buildConditioningBlock(
    "Conditioning circuit",
    ["squat", "horizontal_push", "hinge", "core"],
    baseProfile,
    [],
    undefined,
    { format: "amrap", scope: "circuit" }
  );
  assert.equal(block.format, "amrap");
  assert.equal(block.rounds, 0);
  assert.ok(block.timeCapMinutes >= 8);
  assert.match(block.notes ?? "", /as many rounds as possible/i);
});

test("buildConditioningFinisherBlock uses finisher scope", () => {
  const block = buildConditioningFinisherBlock(baseProfile, []);
  assert.equal(block.scope, "finisher");
  assert.equal(block.format, "amrap");
  assert.ok(block.movements.length >= 2);
});

test("shouldUseAmrapFormat alternates by conditioning session index", () => {
  assert.equal(shouldUseAmrapFormat(0), false);
  assert.equal(shouldUseAmrapFormat(1), true);
});

test("functional_conditioning second conditioning day uses AMRAP", () => {
  const plan = generateProgram({
    ...baseProfile,
    sessionsPerWeek: 6,
    minutesPerSession: 60,
  });
  const conditioningSessions = plan.week.filter(
    (session) => session.conditioningBlock?.scope !== "finisher"
  );
  assert.ok(conditioningSessions.length >= 2);
  const formats = conditioningSessions.map(
    (session) => session.conditioningBlock?.format
  );
  assert.ok(formats.includes("fixed_rounds"));
  assert.ok(formats.includes("amrap"));
});

test("general strength plan can include metabolic finisher", () => {
  const split = getWeeklySplit("general_strength", 4);
  const lastStrengthIndex = split.findLastIndex(
    (entry) => entry.sessionType !== "conditioning"
  );
  assert.ok(
    shouldAttachConditioningFinisher(
      { ...baseProfile, goal: "general_strength", sessionsPerWeek: 4 },
      split[lastStrengthIndex]!,
      split,
      lastStrengthIndex
    )
  );

  const plan = generateProgram({
    ...baseProfile,
    goal: "general_strength",
    sessionsPerWeek: 4,
    minutesPerSession: 60,
  });
  const finisherSession = plan.week.find(
    (session) => session.conditioningBlock?.scope === "finisher"
  );
  assert.ok(finisherSession);
  assert.ok(finisherSession.exercises.length > 0);
});
