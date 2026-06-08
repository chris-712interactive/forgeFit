/** Forge Ember color tokens (mirror of colors.css for programmatic use) */
export const colors = {
  ember: "#FF6B35",
  glow: "#FF8C42",
  gold: "#FBBF24",
  coral: "#FF4D6D",
  steel: "#38BDF8",
  success: "#22C55E",
  surface: "#1C1917",
  surfaceRaised: "#292524",
  cream: "#FFFBF7",
  text: "#FAFAF9",
  muted: "#A8A29E",
} as const;

export type ForgeColor = keyof typeof colors;
