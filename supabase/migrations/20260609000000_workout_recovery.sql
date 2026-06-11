-- Post-workout recovery logging on workout sessions

alter table public.workout_sessions
  add column if not exists recovery_name text,
  add column if not exists recovery_equipment text,
  add column if not exists recovery_planned_minutes integer
    check (recovery_planned_minutes is null or recovery_planned_minutes > 0),
  add column if not exists recovery_status text
    check (recovery_status is null or recovery_status in ('completed', 'skipped')),
  add column if not exists recovery_duration_ms integer
    check (recovery_duration_ms is null or recovery_duration_ms >= 0),
  add column if not exists recovery_completed_at timestamptz;
