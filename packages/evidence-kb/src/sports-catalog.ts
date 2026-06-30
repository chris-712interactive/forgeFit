import catalogData from "../data/sports-catalog.json";

export type SportSeasonPhase = "in_season" | "off_season" | "general_prep";

export interface SportCategory {
  id: string;
  label: string;
}

export interface SportPosition {
  id: string;
  label: string;
  modifier: string;
}

export interface SportDefinition {
  id: string;
  label: string;
  categoryId: string;
  description: string;
  positionAffectsProgram: boolean;
  positions: SportPosition[];
}

export interface SeasonPhaseDefinition {
  id: SportSeasonPhase;
  label: string;
  description: string;
}

export interface SportsCatalog {
  version: string;
  categories: SportCategory[];
  sports: SportDefinition[];
  seasonPhases: SeasonPhaseDefinition[];
}

export const SPORTS_CATALOG = catalogData as SportsCatalog;

export const SPORTS_CATALOG_VERSION = SPORTS_CATALOG.version;

export function getSportCategories(): SportCategory[] {
  return SPORTS_CATALOG.categories;
}

export function getSportById(id: string | null | undefined): SportDefinition | undefined {
  if (!id) return undefined;
  return SPORTS_CATALOG.sports.find((sport) => sport.id === id);
}

export function getSportsByCategory(categoryId: string): SportDefinition[] {
  return SPORTS_CATALOG.sports.filter((sport) => sport.categoryId === categoryId);
}

export function sportRequiresPosition(sportId: string | null | undefined): boolean {
  const sport = getSportById(sportId);
  if (!sport) return false;
  return sport.positionAffectsProgram && sport.positions.length > 0;
}

export function getSeasonPhases(): SeasonPhaseDefinition[] {
  return SPORTS_CATALOG.seasonPhases;
}

export function isValidSportId(id: string): boolean {
  return SPORTS_CATALOG.sports.some((sport) => sport.id === id);
}

export function isValidSportPositionId(
  sportId: string,
  positionId: string
): boolean {
  const sport = getSportById(sportId);
  if (!sport) return false;
  return sport.positions.some((position) => position.id === positionId);
}

export function isValidSeasonPhase(phase: string): phase is SportSeasonPhase {
  return SPORTS_CATALOG.seasonPhases.some((entry) => entry.id === phase);
}
