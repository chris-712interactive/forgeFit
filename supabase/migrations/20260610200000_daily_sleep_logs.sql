-- Daily sleep imported from device integrations (Fitbit via Google Health API).

create table if not exists daily_sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  sleep_date date not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  minutes_in_bed integer check (minutes_in_bed is null or minutes_in_bed >= 0),
  deep_minutes integer check (deep_minutes is null or deep_minutes >= 0),
  rem_minutes integer check (rem_minutes is null or rem_minutes >= 0),
  awake_minutes integer check (awake_minutes is null or awake_minutes >= 0),
  source text not null default 'fitbit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sleep_date)
);

create index if not exists daily_sleep_logs_user_date_idx
  on daily_sleep_logs (user_id, sleep_date desc);

alter table daily_sleep_logs enable row level security;

create policy "Users read own daily sleep"
  on daily_sleep_logs
  for select
  using (auth.uid() = user_id);
