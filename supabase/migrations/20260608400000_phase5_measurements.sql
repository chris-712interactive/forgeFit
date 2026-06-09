-- Phase 5: measurement history, caliper readings, cached projections

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  measured_date date not null,
  weight_kg numeric(5, 1) check (weight_kg is null or (weight_kg between 30 and 300)),
  waist_cm numeric(5, 1),
  chest_cm numeric(5, 1),
  arms_cm numeric(5, 1),
  legs_cm numeric(5, 1),
  neck_cm numeric(5, 1),
  hips_cm numeric(5, 1),
  body_fat_pct numeric(4, 1) check (body_fat_pct is null or (body_fat_pct between 3 and 60)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_date)
);

create table public.caliper_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  measured_date date not null,
  formula text not null check (formula in ('jp3', 'jp7')),
  chest_mm numeric(5, 1) check (chest_mm is null or chest_mm >= 0),
  abdominal_mm numeric(5, 1) check (abdominal_mm is null or abdominal_mm >= 0),
  thigh_mm numeric(5, 1) check (thigh_mm is null or thigh_mm >= 0),
  tricep_mm numeric(5, 1) check (tricep_mm is null or tricep_mm >= 0),
  suprailiac_mm numeric(5, 1) check (suprailiac_mm is null or suprailiac_mm >= 0),
  midaxillary_mm numeric(5, 1) check (midaxillary_mm is null or midaxillary_mm >= 0),
  subscapular_mm numeric(5, 1) check (subscapular_mm is null or subscapular_mm >= 0),
  sum_mm numeric(6, 1) not null check (sum_mm >= 0),
  body_fat_pct numeric(4, 1) not null check (body_fat_pct between 3 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, measured_date)
);

create table public.projections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  projection_type text not null default 'weight_30d',
  horizon_days integer not null default 30 check (horizon_days between 7 and 90),
  payload jsonb not null,
  computed_at timestamptz not null default now(),
  unique (user_id, projection_type)
);

create index body_measurements_user_date_idx
  on public.body_measurements (user_id, measured_date desc);

create index caliper_measurements_user_date_idx
  on public.caliper_measurements (user_id, measured_date desc);

alter table public.body_measurements enable row level security;
alter table public.caliper_measurements enable row level security;
alter table public.projections enable row level security;

create policy "Users view own body measurements"
  on public.body_measurements for select
  using (auth.uid() = user_id);

create policy "Users insert own body measurements"
  on public.body_measurements for insert
  with check (auth.uid() = user_id);

create policy "Users update own body measurements"
  on public.body_measurements for update
  using (auth.uid() = user_id);

create policy "Users delete own body measurements"
  on public.body_measurements for delete
  using (auth.uid() = user_id);

create policy "Users view own caliper measurements"
  on public.caliper_measurements for select
  using (auth.uid() = user_id);

create policy "Users insert own caliper measurements"
  on public.caliper_measurements for insert
  with check (auth.uid() = user_id);

create policy "Users delete own caliper measurements"
  on public.caliper_measurements for delete
  using (auth.uid() = user_id);

create policy "Users view own projections"
  on public.projections for select
  using (auth.uid() = user_id);

create policy "Users upsert own projections"
  on public.projections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
