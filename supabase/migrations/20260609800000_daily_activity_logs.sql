-- Daily activity imported from device integrations (Fitbit via Google Health API).

create table if not exists daily_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  activity_date date not null,
  steps integer check (steps is null or steps >= 0),
  active_calories numeric(8, 2) check (active_calories is null or active_calories >= 0),
  active_minutes integer check (active_minutes is null or active_minutes >= 0),
  source text not null default 'fitbit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create index if not exists daily_activity_logs_user_date_idx
  on daily_activity_logs (user_id, activity_date desc);

alter table daily_activity_logs enable row level security;

create policy "Users read own daily activity"
  on daily_activity_logs
  for select
  using (auth.uid() = user_id);
