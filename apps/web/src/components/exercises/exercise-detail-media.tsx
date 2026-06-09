"use client";

import { useState } from "react";
import { ExerciseAnimation } from "./exercise-animation";
import { MuscleHeatmap } from "./muscle-heatmap";

type MediaTab = "demo" | "muscles";

interface ExerciseDetailMediaProps {
  name: string;
  imagePaths: string[];
  highlightMuscles: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export function ExerciseDetailMedia({
  name,
  imagePaths,
  highlightMuscles,
  primaryMuscles,
  secondaryMuscles,
}: ExerciseDetailMediaProps) {
  const [tab, setTab] = useState<MediaTab>("demo");

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-forge-surface-raised">
      {/* Mobile: one panel at a time */}
      <div className="grid grid-cols-2 gap-1 border-b border-[var(--border)] p-1 sm:hidden">
        <TabButton
          active={tab === "demo"}
          label="Demo"
          onClick={() => setTab("demo")}
        />
        <TabButton
          active={tab === "muscles"}
          label="Muscles"
          onClick={() => setTab("muscles")}
        />
      </div>

      <div className="sm:grid sm:grid-cols-2 sm:divide-x sm:divide-[var(--border)]">
        <div
          className={`min-w-0 p-4 ${tab === "demo" ? "block" : "hidden sm:block"}`}
        >
          <p className="mb-3 hidden font-display text-xs font-semibold uppercase tracking-wider text-forge-muted sm:block">
            Demo
          </p>
          <ExerciseAnimation imagePaths={imagePaths} name={name} />
        </div>

        <div
          className={`min-w-0 border-t border-[var(--border)] p-4 sm:border-t-0 ${
            tab === "muscles" ? "block" : "hidden sm:block"
          }`}
        >
          <p className="mb-3 hidden font-display text-xs font-semibold uppercase tracking-wider text-forge-muted sm:block">
            Muscles worked
          </p>
          <MuscleHeatmap exerciseName={name} muscles={highlightMuscles} />
          <p className="mt-3 text-xs leading-relaxed text-forge-muted">
            <span className="font-medium text-forge-text">Primary:</span>{" "}
            {primaryMuscles.join(", ")}
            {secondaryMuscles.length > 0 && (
              <>
                <br />
                <span className="font-medium text-forge-text">Secondary:</span>{" "}
                {secondaryMuscles.join(", ")}
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-forge-ember text-white"
          : "bg-forge-surface text-forge-muted"
      }`}
    >
      {label}
    </button>
  );
}
