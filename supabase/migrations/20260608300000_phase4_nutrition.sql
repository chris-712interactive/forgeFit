-- Phase 4: nutrition diary logs

create type public.meal_type as enum (
  'breakfast',
  'lunch',
  'dinner',
  'snack'
);

create type public.food_source as enum (
  'usda',
  'off',
  'custom'
);

create table public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null,
  logged_date date not null,
  meal_type public.meal_type,
  food_name text not null,
  food_source public.food_source not null default 'custom',
  external_food_id text,
  brand text,
  serving_description text not null default '100 g',
  quantity numeric(8, 2) not null default 1 check (quantity > 0),
  serving_grams numeric(8, 2) not null default 100 check (serving_grams > 0),
  calories numeric(8, 2) not null default 0 check (calories >= 0),
  protein_g numeric(8, 2) not null default 0 check (protein_g >= 0),
  fat_g numeric(8, 2) not null default 0 check (fat_g >= 0),
  carbs_g numeric(8, 2) not null default 0 check (carbs_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index nutrition_logs_user_date_idx
  on public.nutrition_logs (user_id, logged_date desc);

alter table public.nutrition_logs enable row level security;

create policy "Users view own nutrition logs"
  on public.nutrition_logs for select
  using (auth.uid() = user_id);

create policy "Users insert own nutrition logs"
  on public.nutrition_logs for insert
  with check (auth.uid() = user_id);

create policy "Users update own nutrition logs"
  on public.nutrition_logs for update
  using (auth.uid() = user_id);

create policy "Users delete own nutrition logs"
  on public.nutrition_logs for delete
  using (auth.uid() = user_id);
