export interface MacroPreset {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const BUILTIN_MACRO_PRESETS: MacroPreset[] = [
  {
    id: "protein-shake",
    name: "Protein shake",
    calories: 120,
    proteinG: 30,
    carbsG: 3,
    fatG: 1,
  },
  {
    id: "greek-yogurt",
    name: "Greek yogurt",
    calories: 150,
    proteinG: 20,
    carbsG: 8,
    fatG: 2,
  },
  {
    id: "post-workout",
    name: "Post-workout",
    calories: 250,
    proteinG: 25,
    carbsG: 30,
    fatG: 3,
  },
  {
    id: "standard-lunch",
    name: "Standard lunch",
    calories: 550,
    proteinG: 40,
    carbsG: 45,
    fatG: 18,
  },
];

const STORAGE_KEY = "forgefit:macro-presets";

export function loadSavedMacroPresets(): MacroPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MacroPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMacroPreset(preset: MacroPreset): void {
  const existing = loadSavedMacroPresets();
  const withoutDup = existing.filter((item) => item.id !== preset.id);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([preset, ...withoutDup].slice(0, 12))
  );
}

export function removeMacroPreset(id: string): void {
  const existing = loadSavedMacroPresets().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function createPresetId(): string {
  return `saved-${crypto.randomUUID()}`;
}
