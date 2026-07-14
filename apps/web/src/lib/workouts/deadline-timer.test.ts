import test from "node:test";
import assert from "node:assert/strict";
import {
  elapsedSecondsFromTotal,
  isDeadlineExpired,
  progressPercent,
  remainingSecondsFromDeadline,
} from "./deadline-timer";

test("remainingSecondsFromDeadline uses wall clock when running", () => {
  const state = { endsAtMs: 1_000_000, paused: false as const };
  assert.equal(remainingSecondsFromDeadline(state, 999_100), 1);
  assert.equal(remainingSecondsFromDeadline(state, 1_000_000), 0);
});

test("remainingSecondsFromDeadline freezes while paused", () => {
  const state = {
    endsAtMs: 1_000_000,
    paused: true,
    pausedRemainingMs: 45_000,
  };
  assert.equal(remainingSecondsFromDeadline(state, 2_000_000), 45);
});

test("isDeadlineExpired is false when paused even past endsAtMs", () => {
  const state = {
    endsAtMs: 1_000,
    paused: true,
    pausedRemainingMs: 10_000,
  };
  assert.equal(isDeadlineExpired(state, 9_000), false);
});

test("elapsedSecondsFromTotal reflects time spent", () => {
  const total = 90;
  const state = { endsAtMs: 1_000_000, paused: false as const };
  assert.equal(elapsedSecondsFromTotal(total, state, 970_000), 60);
});

test("progressPercent tracks remaining fraction", () => {
  const state = { endsAtMs: 1_000_000, paused: false as const };
  assert.equal(progressPercent(100, state, 950_000), 50);
});
