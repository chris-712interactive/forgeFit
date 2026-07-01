import assert from "node:assert/strict";
import test from "node:test";
import type { SessionTemplate } from "./splits";
import {
  avoidConsecutiveSameKind,
  rotateSplitAvoidingKind,
  sessionKind,
} from "./session-kind";

function template(name: string): SessionTemplate {
  return { name, patterns: ["squat"] };
}

test("sessionKind normalizes upper and lower variants", () => {
  assert.equal(sessionKind("Upper A"), "upper");
  assert.equal(sessionKind("Upper"), "upper");
  assert.equal(sessionKind("Lower B"), "lower");
  assert.equal(sessionKind("Legs"), "lower");
  assert.equal(sessionKind("Push"), "push");
  assert.equal(sessionKind("Full Body A"), "full_body");
});

test("rotateSplitAvoidingKind starts with a different kind when possible", () => {
  const split = [
    template("Upper"),
    template("Lower"),
    template("Upper"),
    template("Lower"),
  ];

  const rotated = rotateSplitAvoidingKind(split, "upper");

  assert.equal(rotated[0]?.name, "Lower");
  assert.equal(rotated.length, 4);
});

test("avoidConsecutiveSameKind swaps templates on back-to-back days", () => {
  const upper = template("Upper");
  const lower = template("Lower");
  const assignments = [
    { template: upper, dayIndex: 2 },
    { template: upper, dayIndex: 3 },
    { template: lower, dayIndex: 5 },
  ];

  avoidConsecutiveSameKind(assignments);

  assert.equal(assignments.find((a) => a.dayIndex === 2)?.template.name, "Upper");
  assert.equal(assignments.find((a) => a.dayIndex === 3)?.template.name, "Lower");
  assert.equal(assignments.find((a) => a.dayIndex === 5)?.template.name, "Upper");
});
