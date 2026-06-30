import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSportWeeklySplit, modifierForPosition } from "./splits";

describe("sport splits", () => {
  it("basketball post adds lower-body emphasis vs guard", () => {
    const post = getSportWeeklySplit("basketball", "post", 3);
    const guard = getSportWeeklySplit("basketball", "guard", 3);
    assert.notDeepEqual(post, guard);
    assert.ok(post.some((session) => session.patterns.includes("squat")));
  });

  it("football line differs from skill positions", () => {
    const line = getSportWeeklySplit("football", "line", 3);
    const skill = getSportWeeklySplit("football", "skill", 3);
    assert.notDeepEqual(line[0]?.patterns, skill[0]?.patterns);
  });

  it("general athleticism returns base templates", () => {
    const split = getSportWeeklySplit("general_athleticism", null, 4);
    assert.equal(split.length, 4);
    assert.equal(split[0]?.name, "Athletic A");
  });

  it("resolves position modifiers from catalog", () => {
    assert.equal(modifierForPosition("basketball", "post"), "lower_power_post_strength");
    assert.equal(modifierForPosition("softball", "pitcher"), "softball_pitcher_arm_care");
  });
});
