import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSubstitutionReason,
  getSubstitutions,
  suggestBusyEquipment,
} from "./substitutions";
import { resolveExerciseDetail } from "./resolve";

test("getSubstitutions excludes busy equipment from swap candidates", () => {
  const gymGear = [
    "barbell",
    "dumbbells",
    "cables",
    "machines",
    "bench",
    "squat_rack",
    "pull_up_bar",
  ];
  const swaps = getSubstitutions("lat_pulldown", gymGear, 10, {
    excludeEquipment: ["machines"],
  });

  assert.ok(swaps.length > 0);
  assert.ok(
    swaps.every((candidate) => !candidate.equipment.includes("machines")),
    "machine-dependent swaps should be filtered out"
  );
});

test("suggestBusyEquipment prefers machines when exercise uses them", () => {
  const exercise = resolveExerciseDetail("lat_pulldown");
  assert.ok(exercise);
  assert.deepEqual(suggestBusyEquipment(exercise!), ["machines"]);
});

test("buildSubstitutionReason describes equipment change", () => {
  const original = resolveExerciseDetail("lat_pulldown");
  const swaps = getSubstitutions(
    "lat_pulldown",
    ["cables", "machines", "pull_up_bar"],
    1,
    { excludeEquipment: ["machines"] }
  );
  assert.ok(original);
  assert.ok(swaps[0]);
  const reason = buildSubstitutionReason(original!, swaps[0]!, ["machines"]);
  assert.match(reason, /machine/i);
});
