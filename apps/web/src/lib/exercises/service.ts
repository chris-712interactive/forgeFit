import {
  getCatalog,
  getSubstitutions,
  resolveExerciseDetail,
  searchCatalog,
  type CatalogExercise,
} from "@forgefit/exercise-db";
import { loadUserProgramContext } from "@/lib/programs/service";

export async function getUserEquipment(userId: string): Promise<string[]> {
  const context = await loadUserProgramContext(userId);
  return context?.userProfile.equipment ?? ["bodyweight_only"];
}

export async function getExerciseLibraryData(
  userId: string,
  query: {
    q?: string;
    pattern?: string;
    muscle?: string;
    equipment?: string;
  }
) {
  const userEquipment = await getUserEquipment(userId);
  const results = searchCatalog({
    q: query.q,
    pattern: query.pattern as CatalogExercise["movementPattern"] | undefined,
    muscle: query.muscle,
    equipment: query.equipment,
    limit: 60,
  });

  return {
    total: getCatalog().length,
    results,
    userEquipment,
  };
}

export async function getExerciseDetailData(userId: string, id: string) {
  const exercise = resolveExerciseDetail(id);
  if (!exercise) return null;

  const userEquipment = await getUserEquipment(userId);
  const substitutions = getSubstitutions(exercise.id, userEquipment, 6);

  return {
    exercise,
    substitutions,
    userEquipment,
  };
}
