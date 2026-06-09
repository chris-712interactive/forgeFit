-- Phase 3: workout sessions + exercise sets (offline sync targets)

create type public.workout_status as enum (
  'in_progress',
  'completed',
  'cancelled'
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  client_id text not null,
  session_name text not null,
  day_index integer not null default 0,
  status public.workout_status not null default 'in_progress',
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions (id) on delete cascade,
  client_id text not null,
  exercise_id text not null,
  exercise_name text not null,
  set_number integer not null check (set_number >= 1),
  reps integer check (reps is null or reps >= 0),
  weight_kg numeric(7, 2) check (weight_kg is null or weight_kg >= 0),
  rir integer check (rir is null or (rir >= 0 and rir <= 10)),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index workout_sessions_status_idx on public.workout_sessions (user_id, status);
create index exercise_sets_session_idx on public.exercise_sets (workout_session_id);
create index exercise_sets_user_idx on public.exercise_sets (user_id);

alter table public.workout_sessions enable row level security;
alter table public.exercise_sets enable row level security;

create policy "Users view own workout sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own workout sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own workout sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id);

create policy "Users view own exercise sets"
  on public.exercise_sets for select
  using (auth.uid() = user_id);

create policy "Users insert own exercise sets"
  on public.exercise_sets for insert
  with check (auth.uid() = user_id);

create policy "Users update own exercise sets"
  on public.exercise_sets for update
  using (auth.uid() = user_id);
