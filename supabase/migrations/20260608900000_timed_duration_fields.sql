-- Canonical elapsed time for timed sets (holds, cardio, etc.)

alter table public.exercise_sets
  add column duration_ms integer
    check (duration_ms is null or duration_ms >= 0);
