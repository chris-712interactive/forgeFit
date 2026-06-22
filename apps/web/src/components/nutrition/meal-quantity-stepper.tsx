"use client";

import {
  adjustQuantity,
  formatQuantity,
} from "@forgefit/nutrition-core";

interface MealQuantityStepperProps {
  foodId: string;
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

export function MealQuantityStepper({
  foodId,
  value,
  onChange,
  compact = false,
}: MealQuantityStepperProps) {
  const btnClass = compact ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-forge-surface">
      <button
        type="button"
        onClick={() => onChange(adjustQuantity(value, foodId, -1))}
        className={`flex items-center justify-center text-forge-muted hover:text-forge-text ${btnClass}`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-forge-text">
        {formatQuantity(value, foodId)}
      </span>
      <button
        type="button"
        onClick={() => onChange(adjustQuantity(value, foodId, 1))}
        className={`flex items-center justify-center text-forge-muted hover:text-forge-text ${btnClass}`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
