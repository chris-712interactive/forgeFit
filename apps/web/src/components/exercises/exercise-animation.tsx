"use client";

import { exerciseImageUrl } from "@forgefit/exercise-db";
import { useEffect, useState } from "react";

interface ExerciseAnimationProps {
  imagePaths: string[];
  name: string;
}

export function ExerciseAnimation({ imagePaths, name }: ExerciseAnimationProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (imagePaths.length < 2) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % imagePaths.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [imagePaths.length]);

  if (imagePaths.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-forge-surface text-sm text-forge-muted sm:h-64">
        Demo animation coming soon
      </div>
    );
  }

  const src = exerciseImageUrl(imagePaths[frame] ?? imagePaths[0]!);

  return (
    <div className="relative isolate h-56 w-full overflow-hidden rounded-xl bg-forge-surface sm:h-64">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} demonstration`}
        className="mx-auto h-full w-full object-contain p-3"
        loading="eager"
        decoding="async"
      />
      {imagePaths.length > 1 && (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-forge-surface-raised/95 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-forge-muted">
          Animated demo
        </span>
      )}
    </div>
  );
}
