-- Phase 1: profiles, equipment, recovery + RLS

create type public.fitness_goal as enum (
  'fat_loss',
  'bodybuilding',
  'powerlifting',
  'general_strength',
  'recomposition'
);

create type public.experience_level as enum (
  'beginner',
  'intermediate',
  'advanced'
);

create type public.sex_type as enum (
  'male',
  'female',
  'other',
  'prefer_not_to_say'
);

create type public.equipment_location as enum (
  'home',
  'gym',
  'both'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  sex public.sex_type,
  age integer check (age is null or (age >= 13 and age <= 120)),
  experience_level public.experience_level,
  primary_goal public.fitness_goal,
  sessions_per_week integer check (sessions_per_week is null or (sessions_per_week between 1 and 7)),
  minutes_per_session integer check (minutes_per_session is null or (minutes_per_session between 15 and 120)),
  why_started text,
  height_cm numeric(5, 1) check (height_cm is null or (height_cm between 100 and 250)),
  weight_kg numeric(5, 1) check (weight_kg is null or (weight_kg between 30 and 300)),
  waist_cm numeric(5, 1),
  chest_cm numeric(5, 1),
  arms_cm numeric(5, 1),
  legs_cm numeric(5, 1),
  neck_cm numeric(5, 1),
  hips_cm numeric(5, 1),
  onboarding_complete boolean not null default false,
  gamification_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  equipment_type text not null,
  location public.equipment_location not null default 'gym',
  created_at timestamptz not null default now(),
  unique (user_id, equipment_type)
);

create table public.recovery_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  equipment_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, equipment_type)
);

create index equipment_inventory_user_id_idx on public.equipment_inventory (user_id);
create index recovery_equipment_user_id_idx on public.recovery_equipment (user_id);

alter table public.profiles enable row level security;
alter table public.equipment_inventory enable row level security;
alter table public.recovery_equipment enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users manage own equipment"
  on public.equipment_inventory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own recovery equipment"
  on public.recovery_equipment for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
