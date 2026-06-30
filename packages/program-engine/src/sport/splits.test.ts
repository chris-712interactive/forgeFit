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
    assert.equal(modifierForPosition("competitive_cheer", "base"), "stunting_base_strength");
  });

  it("competitive cheer uses dedicated split and position modifiers", () => {
    const base = getSportWeeklySplit("competitive_cheer", "base", 3);
    const tumbler = getSportWeeklySplit("competitive_cheer", "tumbler", 3);
    assert.equal(base[0]?.name, "Jump & Land");
    assert.equal(base[1]?.name, "Stunt Prep");
    assert.notDeepEqual(base, tumbler);
    assert.ok(base.some((session) => session.patterns.includes("horizontal_push")));
    assert.ok(tumbler.some((session) => session.patterns.includes("squat")));
  });
});
