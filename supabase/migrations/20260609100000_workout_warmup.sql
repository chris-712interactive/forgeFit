-- Pre-workout warmup logging on workout sessions

alter table public.workout_sessions
  add column if not exists warmup_name text,
  add column if not exists warmup_planned_minutes integer
    check (warmup_planned_minutes is null or warmup_planned_minutes > 0),
  add column if not exists warmup_status text
    check (warmup_status is null or warmup_status in ('completed', 'skipped')),
  add column if not exists warmup_duration_ms integer
    check (warmup_duration_ms is null or warmup_duration_ms >= 0),
  add column if not exists warmup_completed_at timestamptz;
