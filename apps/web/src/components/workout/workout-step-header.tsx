interface WorkoutStepHeaderProps {
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
  sessionName: string;
  completedSets: number;
  totalSets: number;
}

export function WorkoutStepHeader({
  stepNumber,
  totalSteps,
  stepTitle,
  sessionName,
  completedSets,
  totalSets,
}: WorkoutStepHeaderProps) {
  const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        Step {stepNumber} of {totalSteps}
      </p>
      <h1 className="font-display text-xl font-bold text-forge-text sm:text-2xl">
        {stepTitle}
      </h1>
      <p className="mt-1 text-sm text-forge-muted">
        {sessionName} · {completedSets}/{totalSets} sets logged
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forge-surface">
        <div
          className="h-full rounded-full bg-forge-ember transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
