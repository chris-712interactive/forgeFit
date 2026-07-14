import type { WarmupBlock } from "@forgefit/program-engine";

export type CustomWarmupFocus = WarmupBlock["focus"];

const WARMUP_PRESETS: Record<
  CustomWarmupFocus,
  { name: string; durationMinutes: number; movements: WarmupBlock["movements"] }
> = {
  general: {
    name: "General warmup",
    durationMinutes: 5,
    movements: [
      { id: "warmup_march", name: "March in place", prescription: "60 sec" },
      { id: "warmup_arm_circles", name: "Arm circles", prescription: "10 each direction" },
      { id: "warmup_hip_circles", name: "Hip circles", prescription: "10 each direction" },
    ],
  },
  push: {
    name: "Push warmup",
    durationMinutes: 5,
    movements: [
      { id: "warmup_arm_circles", name: "Arm circles", prescription: "10 each direction" },
      { id: "warmup_shoulder_circles", name: "Shoulder circles", prescription: "10 each direction" },
      { id: "warmup_scapular_pushup", name: "Scapular push-ups", prescription: "10 reps" },
    ],
  },
  pull: {
    name: "Pull warmup",
    durationMinutes: 5,
    movements: [
      { id: "warmup_band_pullapart", name: "Band pull-aparts", prescription: "15 reps" },
      { id: "warmup_cat_cow", name: "Cat-cow", prescription: "10 reps" },
      { id: "warmup_dead_bug", name: "Dead bug", prescription: "8 each side" },
    ],
  },
  legs: {
    name: "Legs warmup",
    durationMinutes: 5,
    movements: [
      { id: "warmup_march", name: "March in place", prescription: "60 sec" },
      { id: "warmup_hip_circles", name: "Hip circles", prescription: "10 each direction" },
      { id: "warmup_bodyweight_squat", name: "Bodyweight squats", prescription: "12 reps" },
    ],
  },
  full_body: {
    name: "Full-body warmup",
    durationMinutes: 6,
    movements: [
      { id: "warmup_march", name: "March in place", prescription: "60 sec" },
      { id: "warmup_arm_circles", name: "Arm circles", prescription: "10 each direction" },
      { id: "warmup_bodyweight_squat", name: "Bodyweight squats", prescription: "12 reps" },
      { id: "warmup_cat_cow", name: "Cat-cow", prescription: "10 reps" },
    ],
  },
};

export const CUSTOM_WARMUP_OPTIONS = Object.entries(WARMUP_PRESETS).map(
  ([focus, preset]) => ({
    focus: focus as CustomWarmupFocus,
    label: preset.name,
  })
);

export function buildCustomWarmupBlock(focus: CustomWarmupFocus): WarmupBlock {
  const preset = WARMUP_PRESETS[focus];
  return {
    name: preset.name,
    durationMinutes: preset.durationMinutes,
    focus,
    movements: preset.movements,
  };
}
