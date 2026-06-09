"use client";

import { sanitizeHighlighterMuscles } from "@forgefit/exercise-db";
import { useEffect, useMemo, useState } from "react";
import Model from "react-body-highlighter";

interface MuscleHeatmapProps {
  exerciseName: string;
  muscles: string[];
}

export function MuscleHeatmap({ exerciseName, muscles }: MuscleHeatmapProps) {
  const [mounted, setMounted] = useState(false);

  const safeMuscles = useMemo(
    () => sanitizeHighlighterMuscles(muscles),
    [muscles]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || safeMuscles.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-forge-surface text-sm text-forge-muted sm:h-64">
        No muscle map for this movement
      </div>
    );
  }

  return (
    <div className="relative isolate h-56 w-full overflow-hidden rounded-xl bg-forge-surface sm:h-64">
      <div className="flex h-full w-full items-center justify-center px-2">
        <Model
          data={[
            {
              name: exerciseName,
              muscles: safeMuscles as never[],
            },
          ]}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "11rem",
            margin: "0 auto",
          }}
          bodyColor="#3f3f3f"
          highlightedColors={["#FF8C42", "#FF6B35", "#FBBF24"]}
          svgStyle={{
            display: "block",
            width: "100%",
            height: "100%",
            maxHeight: "100%",
          }}
        />
      </div>
    </div>
  );
}
