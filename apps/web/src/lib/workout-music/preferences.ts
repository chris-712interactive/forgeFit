import {
  getWorkoutMusicPlaylist,
  isWorkoutMusicVibe,
  type WorkoutMusicPlaylist,
  type WorkoutMusicVibe,
} from "./catalog";

const STORAGE_KEY = "forgerep:workout-music-vibe";

export function getSavedWorkoutMusicVibe(): WorkoutMusicVibe | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || !isWorkoutMusicVibe(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function saveWorkoutMusicVibe(vibe: WorkoutMusicVibe): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, vibe);
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function getSavedWorkoutMusicPlaylist(): WorkoutMusicPlaylist | null {
  const vibe = getSavedWorkoutMusicVibe();
  if (!vibe) return null;
  return getWorkoutMusicPlaylist(vibe) ?? null;
}
