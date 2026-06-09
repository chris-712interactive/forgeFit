/** Slugs supported by react-body-highlighter (anterior view). */
export const VALID_HIGHLIGHTER_MUSCLES = new Set([
  "trapezius",
  "upper-back",
  "lower-back",
  "chest",
  "biceps",
  "triceps",
  "forearm",
  "back-deltoids",
  "front-deltoids",
  "abs",
  "obliques",
  "adductor",
  "abductors",
  "hamstring",
  "quadriceps",
  "calves",
  "gluteal",
  "head",
  "neck",
  "knees",
  "left-soleus",
  "right-soleus",
]);

const HIGHLIGHTER_MAP: Record<string, string[]> = {
  core: ["abs", "obliques"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  back: ["upper-back", "lower-back", "trapezius"],
  neck: ["trapezius"],
  quadriceps: ["quadriceps"],
  shoulders: ["front-deltoids", "back-deltoids"],
  triceps: ["triceps"],
  cardio: [],
};

export function toHighlighterMuscles(muscles: string[]): string[] {
  return sanitizeHighlighterMuscles(
    muscles.flatMap((muscle) => HIGHLIGHTER_MAP[muscle] ?? [])
  );
}

export function sanitizeHighlighterMuscles(muscles: string[]): string[] {
  return [...new Set(muscles.filter((muscle) => VALID_HIGHLIGHTER_MUSCLES.has(muscle)))];
}
