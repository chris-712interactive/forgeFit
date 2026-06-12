-- Cardio / external workouts imported from device integrations (Strava, etc.).

create table if not exists external_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  source text not null default 'strava',
  external_id text not null,
  name text not null,
  activity_type text not null,
  started_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  moving_seconds integer check (moving_seconds is null or moving_seconds >= 0),
  distance_meters numeric(12, 2) check (distance_meters is null or distance_meters >= 0),
  elevation_gain_meters numeric(8, 2),
  calories numeric(8, 2) check (calories is null or calories >= 0),
  average_heartrate integer check (average_heartrate is null or average_heartrate >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

create index if not exists external_activity_logs_user_started_idx
  on external_activity_logs (user_id, started_at desc);

alter table external_activity_logs enable row level security;

create policy "Users read own external activities"
  on external_activity_logs
  for select
  using (auth.uid() = user_id);
