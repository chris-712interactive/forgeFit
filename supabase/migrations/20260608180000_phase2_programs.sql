-- Phase 2: generated training programs

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan jsonb not null,
  evidence_kb_version text not null,
  engine_version text not null,
  goal_type public.fitness_goal not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index programs_user_id_idx on public.programs (user_id);
create index programs_active_idx on public.programs (user_id, is_active)
  where is_active = true;

alter table public.programs enable row level security;

create policy "Users view own programs"
  on public.programs for select
  using (auth.uid() = user_id);

create policy "Users insert own programs"
  on public.programs for insert
  with check (auth.uid() = user_id);

create policy "Users update own programs"
  on public.programs for update
  using (auth.uid() = user_id);
