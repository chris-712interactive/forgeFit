import test from "node:test";
import assert from "node:assert/strict";
import {
  buildForgeRepWorkoutTemplateCsv,
  parseForgeRepWorkoutCsv,
} from "./workout-csv-parser";

test("parseForgeRepWorkoutCsv reads native template format", () => {
  const csv = `# forgerep-workout-template v1
workout_name,Upper Day

exercise_id,barbell_bench_press_medium_grip
exercise_name,Barbell Bench Press
sets,4
reps,8-10
rest_seconds,120

exercise_id,dumbbell_row
exercise_name,Dumbbell Row
sets,3
reps,10
rest_seconds,90
`;

  const result = parseForgeRepWorkoutCsv(csv);
  assert.equal(result.errors.length, 0);
  assert.ok(result.workout);
  assert.equal(result.workout.name, "Upper Day");
  assert.equal(result.workout.exercises.length, 2);
  assert.equal(result.workout.exercises[0]?.exerciseId, "barbell_bench_press_medium_grip");
  assert.equal(result.workout.exercises[0]?.sets, 4);
});

test("parseForgeRepWorkoutCsv rejects missing header", () => {
  const result = parseForgeRepWorkoutCsv("exercise_id,foo");
  assert.equal(result.workout, null);
  assert.ok(result.errors[0]?.includes("Missing header"));
});

test("buildForgeRepWorkoutTemplateCsv round-trips key fields", () => {
  const csv = buildForgeRepWorkoutTemplateCsv({
    name: "Legs",
    exercises: [
      {
        exerciseId: "barbell_squat",
        name: "Barbell Squat",
        sets: 5,
        reps: "5",
        restSeconds: 180,
      },
    ],
  });

  const parsed = parseForgeRepWorkoutCsv(csv);
  assert.equal(parsed.workout?.name, "Legs");
  assert.equal(parsed.workout?.exercises[0]?.sets, 5);
  assert.equal(parsed.workout?.exercises[0]?.restSeconds, 180);
});

test("parseForgeRepWorkoutCsv reads v2 interval protocol and custom ids", () => {
  const csv = `# forgerep-workout-template v2
workout_name,Gravity W1 Full Body
protocol_mode,density
work_seconds,30
rest_seconds,45
rounds,4

exercise_id,custom:barbell_squat
exercise_name,Barbell Squat
sets,4
reps,AMRAP
rest_seconds,45
group_id,

exercise_id,custom:med_ball_slam
exercise_name,Med Ball Slam
sets,4
reps,AMRAP
rest_seconds,45
group_id,A
`;

  const result = parseForgeRepWorkoutCsv(csv);
  assert.equal(result.errors.length, 0);
  assert.ok(result.workout);
  assert.equal(result.workout.intervalProtocol?.mode, "density");
  assert.equal(result.workout.intervalProtocol?.workSeconds, 30);
  assert.equal(result.workout.exercises[0]?.exerciseId, "custom:barbell_squat");
  assert.equal(result.workout.exercises[1]?.groupId, "A");

  const rebuilt = buildForgeRepWorkoutTemplateCsv({
    name: result.workout.name,
    exercises: result.workout.exercises,
    intervalProtocol: result.workout.intervalProtocol,
  });
  assert.ok(rebuilt.includes("# forgerep-workout-template v2"));
  assert.ok(rebuilt.includes("protocol_mode,density"));
});
