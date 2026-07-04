-- In-session exercise swaps: preserve planned exercise on logged sets

alter table public.exercise_sets
  add column if not exists planned_exercise_id text,
  add column if not exists substitution_reason text check (
    substitution_reason is null
    or substitution_reason in ('equipment_busy', 'user_choice')
  );
