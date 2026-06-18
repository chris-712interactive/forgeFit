-- Daily recovery metrics from device integrations (Fitbit via Google Health API).

create table if not exists daily_recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  recovery_date date not null,
  resting_hr_min integer check (resting_hr_min is null or resting_hr_min > 0),
  resting_hr_max integer check (resting_hr_max is null or resting_hr_max > 0),
  hrv_ms_min integer check (hrv_ms_min is null or hrv_ms_min > 0),
  hrv_ms_max integer check (hrv_ms_max is null or hrv_ms_max > 0),
  source text not null default 'fitbit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recovery_date)
);

create index if not exists daily_recovery_logs_user_date_idx
  on daily_recovery_logs (user_id, recovery_date desc);

alter table daily_recovery_logs enable row level security;

create policy "Users read own daily recovery"
  on daily_recovery_logs
  for select
  using (auth.uid() = user_id);
