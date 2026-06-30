import type { FatLossPace, FitnessGoal } from "@/lib/types/profile";
import {
  fatLossPaceBlockedReason,
  isFatLossPaceAllowedForAge,
  isPrimaryGoalAllowedForAge,
  isSecondaryGoalAllowedForAge,
  primaryGoalBlockedReason,
} from "@forgefit/program-engine";

export function filterPrimaryGoalsForAge(
  goals: { value: FitnessGoal; label: string; description: string }[],
  age: number | null
) {
  return goals.map((goal) => {
    if (age == null) {
      return { ...goal, disabled: false, blockedReason: null as string | null };
    }
    const blockedReason = primaryGoalBlockedReason(goal.value, age);
    return {
      ...goal,
      disabled: blockedReason != null,
      blockedReason,
    };
  });
}

export function filterSecondaryGoalsForAge(
  goals: { value: FitnessGoal; label: string; description: string }[],
  age: number | null
) {
  return goals.map((goal) => {
    if (age == null) {
      return { ...goal, disabled: false, blockedReason: null as string | null };
    }
    const blockedReason = primaryGoalBlockedReason(goal.value, age);
    return {
      ...goal,
      disabled: blockedReason != null,
      blockedReason,
    };
  });
}

export function filterFatLossPaceForAge(
  options: { value: FatLossPace; label: string; description: string }[],
  age: number | null
) {
  return options.map((option) => {
    if (age == null) {
      return { ...option, disabled: false, blockedReason: null as string | null };
    }
    const blockedReason = fatLossPaceBlockedReason(option.value, age);
    return {
      ...option,
      disabled: blockedReason != null,
      blockedReason,
    };
  });
}

export function validateGoalsForAge(input: {
  age: number;
  primary_goal: FitnessGoal;
  secondary_goal?: FitnessGoal;
  fat_loss_pace?: FatLossPace;
}): string | null {
  if (!isPrimaryGoalAllowedForAge(input.primary_goal, input.age)) {
    return primaryGoalBlockedReason(input.primary_goal, input.age);
  }

  if (
    input.secondary_goal &&
    !isSecondaryGoalAllowedForAge(input.secondary_goal, input.age)
  ) {
    return primaryGoalBlockedReason(input.secondary_goal, input.age);
  }

  if (
    input.fat_loss_pace &&
    !isFatLossPaceAllowedForAge(input.fat_loss_pace, input.age)
  ) {
    return fatLossPaceBlockedReason(input.fat_loss_pace, input.age);
  }

  return null;
}
