import { ExerciseBackLink } from "@/components/exercises/exercise-back-link";
import { ExerciseDetailMedia } from "@/components/exercises/exercise-detail-media";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { SubstitutionList } from "@/components/exercises/substitution-list";
import { ExerciseWorkoutSwapAction } from "@/components/exercises/exercise-workout-swap-action";
import { getExerciseDetailData } from "@/lib/exercises/service";
import { formatEquipment, formatPattern } from "@/lib/exercises/labels";
import { parseWorkoutSwapReturnTo } from "@/lib/workouts/exercise-swap-return";
import { getMemberContext } from "@/lib/auth/member-context";
import { notFound } from "next/navigation";

interface ExerciseDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function ExerciseDetailPage({
  params,
  searchParams,
}: ExerciseDetailPageProps) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const member = await getMemberContext();

  if (!member) {
    return (
      <div className="px-6 py-8">
        <p className="text-forge-muted">Sign in to view exercise details.</p>
      </div>
    );
  }

  const data = await getExerciseDetailData(member.effectiveUserId, id);
  if (!data) notFound();

  const { exercise, substitutions, userEquipment } = data;

  return (
    <div className={appPagePadding}>
      <ExerciseBackLink returnTo={returnTo} />

      <h1 className="font-display mt-4 text-2xl font-bold text-forge-text">
        {exercise.name}
      </h1>
      <p className="mt-2 text-sm text-forge-muted">
        {formatPattern(exercise.movementPattern)} · {exercise.difficulty} ·{" "}
        {exercise.equipment.map(formatEquipment).join(" · ")}
      </p>

      <div className={`${appHeaderGap} ${appSectionStack}`}>
        <ExerciseDetailMedia
          name={exercise.name}
          imagePaths={exercise.imagePaths}
          highlightMuscles={exercise.highlightMuscles}
          primaryMuscles={exercise.primaryMuscles}
          secondaryMuscles={exercise.secondaryMuscles}
        />

        <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Equipment swaps
          </h2>
          <p className="mt-1 text-xs text-forge-muted">
            Same movement pattern, matched to your inventory
          </p>
          <div className="mt-4">
            <SubstitutionList
              substitutions={substitutions}
              userEquipment={userEquipment}
              returnTo={returnTo}
              workoutSwapTarget={parseWorkoutSwapReturnTo(returnTo)}
            />
          </div>
          <ExerciseWorkoutSwapAction
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            returnTo={returnTo}
          />
        </section>

        {exercise.instructions.length > 0 && (
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              Instructions
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-forge-text">
              {exercise.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
