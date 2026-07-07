-- Per-week workout schedule adjustments (move individual plan slots to different calendar days)

create table public.workout_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  week_start_date date not null,
  day_index integer not null check (day_index >= 0 and day_index <= 6),
  adjusted_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date, day_index)
);

create index workout_schedule_overrides_user_week_idx
  on public.workout_schedule_overrides (user_id, week_start_date);

alter table public.workout_schedule_overrides enable row level security;

create policy "Users view own workout schedule overrides"
  on public.workout_schedule_overrides for select
  using (auth.uid() = user_id);

create policy "Users insert own workout schedule overrides"
  on public.workout_schedule_overrides for insert
  with check (auth.uid() = user_id);

create policy "Users update own workout schedule overrides"
  on public.workout_schedule_overrides for update
  using (auth.uid() = user_id);

create policy "Users delete own workout schedule overrides"
  on public.workout_schedule_overrides for delete
  using (auth.uid() = user_id);
