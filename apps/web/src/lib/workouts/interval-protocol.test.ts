import assert from "node:assert/strict";
import test from "node:test";
import type { IntervalProtocol } from "@forgefit/offline-sync";
import {
  advanceIntervalState,
  initialIntervalState,
  orderedSupersetGroups,
  resolveIntervalBlocks,
} from "./interval-protocol";

test("density advances work → rest → next round → next exercise → done", () => {
  const protocol: IntervalProtocol = {
    mode: "density",
    workSeconds: 30,
    restSeconds: 45,
    rounds: 2,
  };
  let state = initialIntervalState(protocol);
  assert.equal(state.phase, "work");
  assert.equal(state.seconds, 30);

  state = advanceIntervalState(protocol, state, 2);
  assert.deepEqual(
    { phase: state.phase, roundIndex: state.roundIndex, blockIndex: state.blockIndex },
    { phase: "rest", roundIndex: 0, blockIndex: 0 }
  );

  state = advanceIntervalState(protocol, state, 2);
  assert.deepEqual(
    { phase: state.phase, roundIndex: state.roundIndex, blockIndex: state.blockIndex },
    { phase: "work", roundIndex: 1, blockIndex: 0 }
  );

  state = advanceIntervalState(protocol, state, 2);
  assert.equal(state.phase, "rest");

  state = advanceIntervalState(protocol, state, 2);
  assert.deepEqual(
    { phase: state.phase, roundIndex: state.roundIndex, blockIndex: state.blockIndex },
    { phase: "work", roundIndex: 0, blockIndex: 1 }
  );

  state = advanceIntervalState(protocol, state, 2);
  assert.equal(state.phase, "rest");
  state = advanceIntervalState(protocol, state, 2);
  assert.equal(state.phase, "work");
  state = advanceIntervalState(protocol, state, 2);
  assert.equal(state.phase, "rest");
  state = advanceIntervalState(protocol, state, 2);
  assert.equal(state.phase, "done");
});

test("tabata inserts between-exercise rest before next exercise", () => {
  const protocol: IntervalProtocol = {
    mode: "tabata",
    workSeconds: 10,
    restSeconds: 10,
    rounds: 1,
    betweenExerciseRestSeconds: 45,
  };
  let state = initialIntervalState(protocol);
  state = advanceIntervalState(protocol, state, 2);
  assert.equal(state.phase, "rest");
  state = advanceIntervalState(protocol, state, 2);
  assert.deepEqual(
    { phase: state.phase, seconds: state.seconds, blockIndex: state.blockIndex },
    { phase: "between_exercise", seconds: 45, blockIndex: 0 }
  );
  state = advanceIntervalState(protocol, state, 2);
  assert.deepEqual(
    { phase: state.phase, blockIndex: state.blockIndex, roundIndex: state.roundIndex },
    { phase: "work", blockIndex: 1, roundIndex: 0 }
  );
});

test("superset_block walks pairs with pair rest", () => {
  const protocol: IntervalProtocol = {
    mode: "superset_block",
    workSeconds: 300,
    restSeconds: 120,
    rounds: 1,
  };
  const exercises = [
    { name: "A1", groupId: "A" },
    { name: "A2", groupId: "A" },
    { name: "B1", groupId: "B" },
    { name: "B2", groupId: "B" },
  ];
  assert.deepEqual(orderedSupersetGroups(exercises), ["A", "B"]);
  const blocks = resolveIntervalBlocks(protocol, exercises);
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0]?.names, ["A1", "A2"]);

  let state = initialIntervalState(protocol);
  state = advanceIntervalState(protocol, state, blocks.length);
  assert.deepEqual(
    { phase: state.phase, seconds: state.seconds },
    { phase: "pair_rest", seconds: 120 }
  );
  state = advanceIntervalState(protocol, state, blocks.length);
  assert.deepEqual(
    { phase: state.phase, blockIndex: state.blockIndex },
    { phase: "work", blockIndex: 1 }
  );
  state = advanceIntervalState(protocol, state, blocks.length);
  assert.equal(state.phase, "done");
});
