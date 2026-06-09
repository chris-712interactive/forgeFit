import { Suspense } from "react";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { getExerciseLibraryData } from "@/lib/exercises/service";
import { createClient } from "@/lib/supabase/server";

interface ExercisesPageProps {
  searchParams: Promise<{
    q?: string;
    pattern?: string;
    muscle?: string;
    equipment?: string;
  }>;
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = user
    ? await getExerciseLibraryData(user.id, params)
    : { total: 0, results: [], userEquipment: [] };

  return (
    <div className={appPagePadding}>
      <h1 className="font-display text-2xl font-bold text-forge-text">
        Exercise Library
      </h1>
      <p className="mt-2 text-forge-muted">
        Browse demos, muscle maps, and equipment swaps for your program.
      </p>

      {user ? (
        <div className={`${appHeaderGap} ${appSectionStack}`}>
          <Suspense fallback={<p className="text-sm text-forge-muted">Loading search…</p>}>
            <ExerciseSearch total={data.total} />
          </Suspense>
          <ExerciseList results={data.results} />
        </div>
      ) : (
        <div
          className={`${appHeaderGap} rounded-2xl border border-dashed border-[var(--border)] p-8 text-center`}
        >
          <p className="text-forge-muted">Sign in to browse exercises.</p>
        </div>
      )}
    </div>
  );
}
